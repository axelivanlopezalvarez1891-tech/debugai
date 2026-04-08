const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
    const db = await open({ filename: './database.sqlite', driver: sqlite3.Database });
    const row = await db.get("SELECT id, username, mensajes FROM chats ORDER BY id DESC LIMIT 1;");
    console.log(JSON.stringify(row, null, 2));
})();
