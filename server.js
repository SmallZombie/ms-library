const HTTP = require('http');
const EXPRESS = require('express');
const CORS = require('cors');
const FS = require('fs');
const PATH = require('path');
const BODY_PARSE = require('body-parser');

const APP = EXPRESS();
// 去除请求体大小限制
// 参考：https://bobbyhadz.com/blog/request-entity-too-large-error-in-node-js-and-express
APP.use(BODY_PARSE.json({limit: '35mb'}));
APP.use(
    BODY_PARSE.urlencoded({
        extended: true,
        limit: '35mb', // 请求体最大限制
        parameterLimit: 50000, // 请求参数最大限制
    }),
);

const DATA_FILE_PATH = './data.json';
const PORT = 3000;
const VERSION = '1.0';


APP.use(CORS()); // 使用cors中间件来处理跨域请求
APP.use(EXPRESS.json()); // json处理请求体中间件

/** 检查data.json是否存在，不存在会自动创建并准备初始数据 */
function checkFileExists() {
    if (!FS.existsSync(DATA_FILE_PATH)) // 文件不存在
        FS.writeFile(DATA_FILE_PATH, JSON.stringify({ skins: [] }, null, 2), 'utf8', e => {
            if (e) console.error("创建初始data.json时发生错误: " + e);
        });
}

/** 生成Id，大概率不会重复，当前使用环境足够 */
function spawnId() {
    const timestamp = new Date().getTime(); // 获取当前时间戳
    const random = Math.random().toString(36).substring(2, 7); // 生成一个随机字符串
    return timestamp + random;
}

/**
 * 备份'./data.json'，返回是否备份成功
 * @returns 返回是否备份成功，当返回false时，应立即停止接下来的写入操作
 */
function backupData() {
    const maxBackupFiles = 100;
    const backupPath = './#backup/';

    // 创建新的备份
    const data = FS.readFileSync(DATA_FILE_PATH, 'utf8');
    FS.writeFile(backupPath + new Date().getTime() + '.json', data, e => {
        if (e) {
            console.error("备份data.json时发生错误: " + e);
            return false;
        }
    });

    // 清理较早的备份文件
    FS.readdir(backupPath, (e, files) => {
        if (e) {
            console.error('读取备份目录时发生错误: ', e);
            return false;
        }

        if (files.length > maxBackupFiles) {
            // 对文件按修改时间升序排序
            files.sort((a, b) => {
                const fileA = FS.statSync(PATH.join(backupPath, a));
                const fileB = FS.statSync(PATH.join(backupPath, b));
                return fileA.mtime - fileB.mtime;
            });

            // 删除最早的备份文件
            for (let i = 0; i < files.length - maxBackupFiles; i++) {
                const filePath = PATH.join(backupPath, files[i]);
                FS.unlink(filePath, (e) => {
                    if (e) console.error('删除文件时发生错误: ', e);
                });
            }
        }
    });
    return true;
}


APP.post('/add', (res, req) => {
    try {
        checkFileExists();

        // 读取
        let data = FS.readFileSync(DATA_FILE_PATH, 'utf-8');
        data = JSON.parse(data);

        if (res.body.file_skin) { // 标准皮肤文件
            // 处理数据
            res.body.name = res.body.name.replace(/^\s+|\s+$/g, '');
            if (res.body.from && (/^https?:\/\/(www\.)?namemc\.com/i).exec(res.body.fromData)) {
                req.end('{"code":400,"message":"请求有误","data":{"message":"非法提交"}}');
                return;
            }

            data.skins.push({
                name: res.body.name, // 皮肤名
                slim: res.body.slim, // 是否为纤细
                type: res.body.type, // 皮肤分类
                from: res.body.from, // 来源
                fromMeta: res.body.from ? res.body.fromMeta : '', // 来源相关信息
                id: spawnId(), // 由后端生成的唯一Id
                uploadTime: new Date().getTime(), // 由后端生成的上传时间
                file_skin: { // 皮肤源文件
                    name: res.body.file_skin.name, // 皮肤文件名
                    editTime: res.body.file_skin.editTime, // 最后修改时间
                    base64Data: res.body.file_skin.base64Data, // base64数据(不包含data前缀)
                    md5: res.body.file_skin.md5 // 文件md5
                },
                file_view: { // 皮肤预览图
                    creativeTime: new Date().getTime(), // 由后端生成的创建时间
                    base64Data: res.body.file_view.base64Data // base64数据(不包含data前缀)
                }
            });
        } else { // 非标准皮肤文件
            data.skins.push({
                name: res.body.name,
                type: res.body.type,
                from: res.body.from,
                id: spawnId(),
                uploadTime: new Date().getTime(),
                file_view: {
                    creativeTime: new Date().getTime(),
                    base64Data: res.body.file_view.base64Data
                }
            });
        }

        // 写回
        FS.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8', e => {
            if (!backupData()) {
                req.end('{"code":500,"message":"无法创建备份"}');
                return;
            }
            if (e) console.error('写入文件时发生错误: ', e);
        });

        // 响应
        req.end('{"code":200,"message":"提交成功"}');
    } catch (e) {
        console.error(e);
        req.end('{"code":500,"message":"服务器内部错误"}');
    }
});

const spportUrl = []
APP.post('/addByUrl', (res, req) => {
    if (!res.body.url) {
        req.end('{"code":400,"message":"url不可为空"}');
        return;
    }
    if (!spportUrl.includes(res.body.url)) {
        req.end('{"code":400,"message":"不支持的Url"}');
        return;
    }

    req.end('{"code":200,"message":"这个接口还没做捏"}');
})

APP.get('/get', (req, res) => {
    checkFileExists();
    FS.readFile(DATA_FILE_PATH, 'utf8', (e, data) => {
        res.end(data);
    })
});

APP.get('/getMetaById', (req, res) => {
    checkFileExists();
    const data = JSON.parse(FS.readFileSync(DATA_FILE_PATH, 'utf8'));
    for (let i = 0; i < data.skins.length; i++) {
        if (req.query.id === data.skins[i].id) {
            res.end(JSON.stringify(data.skins[i]));
            return;
        }
    }
    res.end('{"code":400,"message":"Id不存在"}');
});

APP.delete('/deleteSkinById', (req, res) => {
    checkFileExists();
    if (!req.query.id) {
        res.end('{"code":400,"message":"Id不存在"}');
        return;
    }
    // 读取
    const data = JSON.parse(FS.readFileSync(DATA_FILE_PATH, 'utf8'));
    for (let i = 0; i < data.skins.length; i++) {
        if (req.query.id === data.skins[i].id) {
            data.skins.splice(i, 1);
            // 回写
            if (!backupData()) {
                res.end('{"code":500,"message":"无法创建备份"}');
                return;
            }
            FS.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8', e => {
                if (e) console.error('写入文件时发生错误: ', e);
            });
            res.end('{"code":200,"message":"删除成功"}');
            return;
        }
    }
    res.end('{"code":400,"message":"Id不存在"}');
})

APP.put('/renameById', (req, res) => {
    checkFileExists();
    if (!req.query.id || !req.body.newName) res.end('{"code":400,"message":"Id和newName不可为空"}');

    // 读取
    const data = JSON.parse(FS.readFileSync(DATA_FILE_PATH, 'utf8'));
    for (let i = 0; i < data.skins.length; i++) {
        if (req.query.id === data.skins[i].id) {
            data.skins[i].name = req.body.newName;
            // 回写
            if (!backupData()) {
                res.end('{"code":500,"message":"无法创建备份"}');
                return;
            }
            FS.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8', e => {
                if (e) console.error('写入文件时发生错误: ', e);
            });
            res.end('{"code":200,"message":"修改成功"}');
        }
    }
})

APP.put('/switchArmStyle', (req, res) => {
    checkFileExists();
    if (!req.query.id) res.end('{"code":400,"message":"Id不可为空"}');

    // 读取
    const data = JSON.parse(FS.readFileSync(DATA_FILE_PATH, 'utf8'));
    for (let i = 0; i < data.skins.length; i++) {
        if (req.query.id === data.skins[i].id) {
            data.skins[i].slim = !data.skins[i].slim;
            // 回写
            if (!backupData()) {
                res.end('{"code":500,"message":"无法创建备份"}');
                return;
            }
            FS.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8', e => {
                if (e) console.error('写入文件时发生错误: ', e);
            });
            res.end('{"code":200,"message":"切换成功"}');
        }
    }
})

APP.get('/getSkinMetaByPlayername', async (res, req) => {
    // 我直接开摆
    req.end('{"code":500,"message":"接口已放弃开发"}');

    if (!res.query.playername) {
        req.end('{"code":400,"message":"playername不可为空"}');
        return;
    }

    let data = void 0;
    try {
        // 根据玩家名获取uuid，这个地址原本是https的，但显示443老是连接超时，就换成http了，反正不影响
        let response = await fetch('http://api.mojang.com/users/profiles/minecraft/' + res.query.playername);
        if (!response.ok) throw new Error(`无法访问目标服务器，远端服务器返回 ${response.status}`);
        data = await response.json();
    } catch (e) {
        console.error(e);
        req.end(`{"code":500,"message":"服务器错误：${e}。"}`);
        return;
    }
    try {
        // 根据uuid获取个人资料base64，这个地址原本是https的，但显示443老是连接超时，就换成http了，反正不影响
        let response = await fetch('http://sessionserver.mojang.com/session/minecraft/profile/' + data.id);
        if (!response.ok) throw new Error(`无法访问目标服务器，远端服务器返回 ${response.status}`);
        data = await response.json();

        // 解密base64
        data = JSON.parse(Buffer.from(data.properties[0].value, 'base64').toString('utf8'));
    } catch (e) {
        console.error(e);
        req.end(`{"code":500,"message":"服务器错误：${e}。"}`);
        return;
    }
    req.end(`{"code":200,"message":"请求成功","data":{"skinUrl":"${data.textures.SKIN.url}","slim":${data.textures.SKIN.metadata.model === 'slim' ? true : false}}}`);
})

APP.get('/getSkinMetaFromUrl', async (res, req) => {
    // 验证url
    let urlReg = /^https:\/\/namemc\.com\/skin\/((?:[^/?#]+))$/.exec(res.query.url);
    if (!urlReg) {
        req.end('{"code":400,"message":"请求有误","data":{"message":"无效网址"}}');
        return;
    }

    fetch(`https://s.namemc.com/i/${urlReg[1]}.js`)
        .then(response => response.text())
        .then(data => {
            let dataReg = /\{"[^"]+":\s*"([^"]+)"\}/.exec(data);
            if (dataReg) {
                req.end(`{"code":200,"message":"请求成功","data":{"name":"${urlReg[1]}","skinBase64":"${dataReg[1]}"}}`);
                return;
            } else {
                req.end('{"code":400,"message":"请求有误","data":{"message":"无效网址"}}');
            }
        })
})

const server = HTTP.createServer(APP);
server.listen(PORT, () => {
    console.log(`(${VERSION}) 正在监听端口 ${PORT}`);
});