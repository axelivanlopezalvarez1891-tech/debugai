import "dotenv/config";
import app from "./app.js";
import { initDB, getDB } from "./config/db.js";
import { log } from "./utils/logger.js";

const PORT = process.env.PORT || 3000;

async function runAutomationEngine() {
  let db;
  try {
    db = getDB();
  } catch(e) { return; } // db not ready yet
  if (!db) return;

  try {
    const users = await db.all("SELECT * FROM users");
    const now = Date.now();
    for (let u of users) {
      if (u.premium > 1 && Date.now() > u.premium) { 
        await db.run('UPDATE users SET premium = 0 WHERE username = ?', [u.username]); 
        u.premium = 0; 
      }
      if (u.premium === 1 || u.premium > Date.now() || u.is_admin === 1) continue;
      
      let flags = {};
      try { flags = JSON.parse(u.automation_flags || '{}'); } catch(e) {}
      
      const lastLoginMs = new Date(u.last_login || u.created_at || now).getTime();
      const inactividadHoras = (now - lastLoginMs) / (1000 * 60 * 60);
      if (inactividadHoras >= 48 && !flags.re_engagement_48h) {
          flags.re_engagement_48h = true;
          await db.run("UPDATE users SET pending_gift = ?, automation_flags = ? WHERE username = ?", [JSON.stringify({type:"tokens", amount: 10}), JSON.stringify(flags), u.username]);
          await db.run("INSERT INTO eventos (username, tipo_evento, metadata) VALUES (?, ?, ?)", [u.username, 'AUTOMATION_TRIGGERED', JSON.stringify({rule: 're_engagement_48h'})]);
          await db.run("INSERT INTO eventos (username, tipo_evento, metadata) VALUES (?, ?, ?)", [u.username, 'REWARD_GIVEN', JSON.stringify({amount: 10, reason: '48h inactivity'})]);
          continue; 
      }

      if (u.creditos <= 0) {
         const lastEmpty = await db.get("SELECT timestamp FROM eventos WHERE username = ? AND tipo_evento = 'SIN_TOKENS' ORDER BY timestamp DESC LIMIT 1", [u.username]);
         if (lastEmpty && !u.pending_gift) { 
            const emptyMs = new Date(lastEmpty.timestamp).getTime();
            const minSinceEmpty = (now - emptyMs) / (1000 * 60);
            
            const lastRewardMs = flags.last_empty_reward || 0;
            const daysSinceReward = (now - lastRewardMs) / (1000 * 60 * 60 * 24);
            
            if (minSinceEmpty >= 10 && daysSinceReward >= 7) {
                flags.last_empty_reward = now;
                await db.run("UPDATE users SET pending_gift = ?, automation_flags = ? WHERE username = ?", [JSON.stringify({type:"tokens", amount: 5}), JSON.stringify(flags), u.username]);
                await db.run("INSERT INTO eventos (username, tipo_evento, metadata) VALUES (?, ?, ?)", [u.username, 'AUTOMATION_TRIGGERED', JSON.stringify({rule: 'empty_tokens_10m'})]);
            }
         }
      }
    }
  } catch(e) {
    log.error('AUTOMATION_ENGINE_ERROR', { error: e.message });
  }
}

async function startServer() {
  try {
    await initDB();
    log.info('DATABASE_CONNECTED');

    // Inicializar Automatizaciones
    setInterval(runAutomationEngine, 60000);
    
    app.listen(PORT, () => {
      log.info('SERVER_START', { port: PORT });
    });
  } catch (err) {
    log.error('SERVER_START_FAILED', { error: err.message });
    process.exit(1);
  }
}

startServer();
