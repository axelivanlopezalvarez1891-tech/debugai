const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function makeAdmin() {
  const db = await open({
    filename: 'database.sqlite',
    driver: sqlite3.Database
  });

  const username = 'AXEL';
  const password = 'Axel1891';
  
  // Buscar usuario
  const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
  
  if (user) {
    console.log(`Usuario encontrado: ${user.username}. Elevando a ADMIN...`);
    await db.run("UPDATE users SET password = ?, is_admin = 1, premium = 1, creditos = 9999 WHERE username = ?", [password, username]);
    console.log("¡ÉXITO! Usuario ahora es ADMIN SUPREMO con PRO ilimitado.");
  } else {
    console.log(`Usuario ${username} no encontrado. Creándolo...`);
    await db.run("INSERT INTO users (username, password, is_admin, premium, creditos) VALUES (?, ?, 1, 1, 9999)", [username, password]);
    console.log("¡ÉXITO! Usuario creado. Username: AXEL | Pass: Axel1891");
  }
  
  await db.close();
}

makeAdmin().catch(console.error);
