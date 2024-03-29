const EXPRESS = require('express');
const CORS = require('cors');
const BODY_PARSE = require('body-parser');
const SQLITE = require('sqlite3').verbose();
const READLINE = require('readline');

const APP = EXPRESS();
APP.use(BODY_PARSE.json({ limit: '35mb' }));
APP.use(CORS()); // 用于处理跨域
APP.use(EXPRESS.json()); // 用于处理 json 请求体

const rl = READLINE.createInterface({
    input: process.stdin,
    output: process.stdout
});

const G_DATA_FILE_PATH = './data.db';
const G_PORT = 3000;
const G_VERSION = '1.1.0';
const G_VERSION_DATABASE = 2;
const G_DEBUG = false;
const G_MESSAGES = {
    200: '请求成功',
    400: '请求有误',
    404: '皮肤不存在',
    500: '服务器错误'
}


// from [here](https://patorjk.com/software/taag/#p=display&f=Big&t=MSLibrary)
console.log(`
  __  __  _____ _      _ _
 |  \\/  |/ ____| |    (_) |
 | \\  / | (___ | |     _| |__  _ __ __ _ _ __ _   _
 | |\\/| |\\___ \\| |    | | '_ \\| '__/ _\` | '__| | | |
 | |  | |____) | |____| | |_) | | | (_| | |  | |_| |
 |_|  |_|_____/|______|_|_.__/|_|  \\__,_|_|   \\__, |
                                               __/ |
                                              |___/
 v${G_VERSION}
`);


/** 初始化数据库 */
const db = new SQLITE.Database(G_DATA_FILE_PATH);
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS system (
        id INTEGER PRIMARY KEY,
        version INTEGER
    )`);
    db.get('SELECT * FROM system WHERE id = 1', async (e, row) => {
        new Promise((resolve, reject) => {
            if (!row) db.run(`INSERT INTO system (version) VALUES (?)`, G_VERSION_DATABASE, resolve);
            else if (row.version !== G_VERSION_DATABASE) {
                rl.question(`[WARN] 警告，预期数据库版本(${G_VERSION_DATABASE})与实际数据库版本(${row.version})不同，是否继续？(any/n)\n[INFO] tips：你可以尝试运行对应的 upgrade_x-x.js 来升级数据库版本\n`, e => {
                    if (e === 'n') process.exit(0);
                    resolve();
                });
            } else resolve();
        }).then(() =>  run());
    });

    db.run(`CREATE TABLE IF NOT EXISTS skin (
        id INTEGER PRIMARY KEY,
        name TEXT,
        slim INTEGER,
        type TEXT,
        tags TEXT,
        source TEXT,
        upload_date INTEGER,
        file TEXT,
        preview TEXT
    )`);
});


// 全局响应
function r(res, code, data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(code).send({
        code,
        message: G_MESSAGES[code],
        data,
    });
}


// 添加皮肤
APP.post('/add', (req, res) => {
    db.run('INSERT INTO skin (name, slim, type, tags, source, upload_date, file, preview) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
        req.body.name, // 皮肤名
        req.body.slim, // 是否为纤细
        req.body.type, // 皮肤分类
        JSON.stringify(req.body.tags), // 标签
        JSON.stringify(req.body.source), // 来源，留空就是本地文件，带有 url 字段就是从站点添加
        new Date().getTime(), // 由后端生成的上传日期
        // 为了兼容更多的上传方式，下面两个属性将完全使用前端的格式
        JSON.stringify(req.body.file), // 原文件
        JSON.stringify(req.body.preview) // 预览图
    ], e => {
        if (e) r(res, 500);
        else r(res, 200);
    });
});

// 删除皮肤
APP.delete('/deleteSkinById', (req, res) => {
    db.run('DELETE FROM skin WHERE id = ?', req.query.id, (e) => {
        if (e) r(res, 500);
        else r(res, 200);
    });
});

// 修改皮肤名
APP.put('/renameById', (req, res) => {
    db.run('UPDATE skin SET name = ? WHERE id = ?', [req.body.newName, req.query.id], e => {
        if (e) r(res, 500);
        else r(res, 200);
    });
});

// 切换纤细
APP.put('/setArmStyle', (req, res) => {
    db.run('UPDATE skin SET slim = ?, preview = ? WHERE id = ?', [
        req.body.newSlim,
        JSON.stringify(req.body.newPreview),
        req.query.id
    ], e => {
        if (e) r(res, 500);
        else r(res, 200);
    });
});

// 获取皮肤，有 id 就是返回特定，没有就返回全部
APP.get('/get', (req, res) => {
    function handleRow(row) {
        row.slim = row.slim === null ? null : row.slim === 1;
        row.source = row.source ? JSON.parse(row.source) : null;
        row.tags = row.tags ? JSON.parse(row.tags) : [];
        row.file = JSON.parse(row.file);
        row.preview = row.preview ? JSON.parse(row.preview) : null;

        return row;
    }

    if (req.query.id) {
        db.get('SELECT * FROM skin WHERE id = ?', req.query.id, (e, row) => {
            if (e) r(res, 500);
            else if (!row) r(res, 400);
            else r(res, 200, handleRow(row));
        });
    } else {
        db.all('SELECT * FROM skin', (e, rows) => {
            if (e) r(res, 500);
            else {
                const skins = [];
                for (const i of rows) {
                    skins.push(handleRow(i));
                }
                r(res, 200, { list: skins });
            }
        });
    }
});

// 从支持的站点获取皮肤
APP.get('/getSkinFromUrl', (req, res) => {
    const reg = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/.exec(req.query.url)[1];

    if (reg === 'namemc.com') {
        const id = req.query.url.split('/').pop();
        fetch(`https://s.namemc.com/i/${id}.js`)
            .then(data => data.text())
            .then(data => {
                const dataReg = /\{"[^"]+":\s*"([^"]+)"\}/.exec(data);
                r(res, 200, {
                    name: id,
                    skinBase64: dataReg[1]
                });
            });
    } else r(res, 400);
});

// 全局错误处理
APP.use((err, req, res, next) => {
    console.log('全局错误处理：', err);

    r(res, 500, G_DEBUG ? {
        debug: err.stack
    } : void 0);
});

function run() {
    APP.listen(G_PORT, () => {
        console.log(`[INFO] 正在监听端口 ${G_PORT}`);
    });
}
