const FS = require('fs');
const SQLITE = require('sqlite3').verbose();


// 检查文件是否存在
if (!FS.existsSync('data.json')) {
    console.error('[ERROR] 未找到 data.json');
    process.exit(1);
}

// 备份 data.json
const timestamp = Date.now();
FS.copyFileSync('data.json', 'data.json.bak_' + timestamp);
console.log('[INFO] 已备份 data.json.bak_' + timestamp);

// 准备数据库文件
const db = new SQLITE.Database(`data_upgrade_${timestamp}.db`);
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS system (
        id INTEGER PRIMARY KEY,
        version INTEGER
    )`);
    db.run(`INSERT INTO system (version) VALUES (?)`, 2);

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

// 开始升级
let errCount = 0;
const oldData = JSON.parse(FS.readFileSync('data.json', 'utf-8'));
for (const i of oldData.skins) {
    try {
        db.run('INSERT INTO skin (name, slim, type, tags, source, upload_date, file, preview) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
            i.name,
            i.slim,
            i.type === '' ? null : i.type,
            '[]',
            i.fromMeta ? JSON.stringify({
                url: i.fromMeta
            }) : null,
            i.uploadTime,
            i.file_skin ? JSON.stringify({
                name: i.file_skin.name,
                modified_date: i.file_skin.editTime,
                data: 'data:image/png;base64,' + i.file_skin.base64Data,
                md5: i.file_skin.md5
            }) : JSON.stringify({
                data: 'data:image/png;base64,' + i.file_view.base64Data
            }),
            i.file_skin ? JSON.stringify({
                data: 'data:image/png;base64,' + i.file_view.base64Data
            }) : null
        ], e => {
            if (e) {
                errCount++;
                console.error('[ERROR] 插入数据时发生错误：', e, i.id);
            }
        });
    } catch(e) {
        errCount++;
        console.error('[ERROR] 发生未知错误：', e);
    }
}

console.log(`[INFO] 升级完成，发生错误 ${errCount}/${oldData.skins.length}，新的数据库位于 ./data_upgrade_${timestamp}.db`);
