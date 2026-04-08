// fix_db.js — Reparacion de la base de datos: columnas faltantes + usuario Axel
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function fix() {
  const db = await open({ filename: './database.sqlite', driver: sqlite3.Database });
  
  const info = await db.all("PRAGMA table_info(users)");
  const colNames = info.map(c => c.name);
  console.log('Columnas actuales:', colNames.join(', '));
  
  const toAdd = [
    { name: 'created_at', sql: "ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NULL" },
    { name: 'is_admin', sql: "ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0" },
    { name: 'last_login', sql: "ALTER TABLE users ADD COLUMN last_login TIMESTAMP DEFAULT NULL" },
    { name: 'automation_flags', sql: "ALTER TABLE users ADD COLUMN automation_flags TEXT DEFAULT '{}'" },
    { name: 'pending_gift', sql: "ALTER TABLE users ADD COLUMN pending_gift TEXT DEFAULT NULL" }
  ];
  
  for (const col of toAdd) {
    if (!colNames.includes(col.name)) {
      try {
        await db.exec(col.sql);
        console.log('[OK] Columna agregada:', col.name);
      } catch(e) {
        console.log('[SKIP]', col.name, ':', e.message);
      }
    } else {
      console.log('[EXISTS]', col.name);
    }
  }
  
  const axel = await db.get("SELECT * FROM users WHERE LOWER(username) = 'axel'");
  if (!axel) {
    await db.run("INSERT INTO users (username, password, is_admin, premium, creditos) VALUES ('Axel','Axel1891',1,1,999999)");
    console.log('[OK] Usuario Axel creado con is_admin=1');
  } else {
    await db.run("UPDATE users SET password = 'Axel1891', is_admin = 1, premium = 1, creditos = 999999 WHERE LOWER(username) = 'axel'");
    console.log('[UPDATE] Axel: password corregido a Axel1891, admin=1, premium=1');
  }
  
  const finalInfo = await db.all("PRAGMA table_info(users)");
  console.log('Columnas finales:', finalInfo.map(c => c.name).join(', '));
  
  await db.close();
  console.log('DB reparada exitosamente.');
}

fix().catch(console.error);

