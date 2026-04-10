import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import { log } from "../utils/logger.js";

let dbInstance = null;

export async function initDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      premium INTEGER DEFAULT 0,
      creditos INTEGER DEFAULT 30,
      nombre TEXT DEFAULT '',
      rol TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      folder TEXT DEFAULT 'Sin Carpeta',
      titulo TEXT DEFAULT 'Nueva Conversación',
      mensajes TEXT DEFAULT '[]',
      FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      fact TEXT NOT NULL,
      FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS payments (
      payment_id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      username TEXT NOT NULL,
      type TEXT NOT NULL,
      amount_cents INTEGER DEFAULT 0,
      tokens_granted INTEGER DEFAULT 0,
      status TEXT DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      tipo_evento TEXT NOT NULL,
      metadata TEXT DEFAULT '{}',
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try { await dbInstance.exec("ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"); } catch(e){}
  try { await dbInstance.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;"); } catch(e){}
  try { await dbInstance.exec("ALTER TABLE users ADD COLUMN last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"); } catch(e){}
  try { await dbInstance.exec("ALTER TABLE users ADD COLUMN automation_flags TEXT DEFAULT '{}';"); } catch(e){}
  try { await dbInstance.exec("ALTER TABLE users ADD COLUMN pending_gift TEXT DEFAULT NULL;"); } catch(e){}
  try { await dbInstance.exec("ALTER TABLE users ADD COLUMN last_platform TEXT DEFAULT 'Desktop';"); } catch(e){}
  try { await dbInstance.exec("ALTER TABLE users ADD COLUMN usage_today INTEGER DEFAULT 0;"); } catch(e){}
  try { await dbInstance.exec("ALTER TABLE users ADD COLUMN last_usage_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"); } catch(e){}
  // Stripe subscription columns
  try { await dbInstance.exec("ALTER TABLE users ADD COLUMN stripe_customer_id TEXT DEFAULT NULL;"); } catch(e){}
  try { await dbInstance.exec("ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT DEFAULT NULL;"); } catch(e){}
  try { await dbInstance.exec("ALTER TABLE users ADD COLUMN stripe_plan TEXT DEFAULT 'free';"); } catch(e){}
  try { await dbInstance.exec("ALTER TABLE users ADD COLUMN stripe_period_end INTEGER DEFAULT NULL;"); } catch(e){}

  // [ADMIN] Restauración automática de cuenta Maestra
  try {
    const adminUser = 'AXEL';
    const adminPass = 'Axel1891';
    const existing = await dbInstance.get("SELECT username FROM users WHERE username = ?", [adminUser]);
    if (!existing) {
       await dbInstance.run("INSERT INTO users (username, password, is_admin, premium, creditos) VALUES (?, ?, 1, 1, 9999)", [adminUser, adminPass]);
       log.info('ADMIN_AUTO_CREATED', { user: adminUser });
    } else {
       await dbInstance.run("UPDATE users SET password = ?, is_admin = 1, premium = 1, creditos = 9999 WHERE username = ?", [adminPass, adminUser]);
       log.info('ADMIN_RESTORED', { user: adminUser });
    }
  } catch (e) { log.error("Error al restaurar Admin:", {error: e.message}); }

  // [STAGING] Crear cuenta test_user automáticamente
  const testUserExists = await dbInstance.get("SELECT username FROM users WHERE username = 'test_user'");
  if (!testUserExists) {
     await dbInstance.run("INSERT INTO users (username, password, creditos, premium, is_admin) VALUES ('test_user', 'test123', 200, 0, 0)");
  }

  return dbInstance;
}

export function getDB() {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDB() first.");
  }
  return dbInstance;
}
