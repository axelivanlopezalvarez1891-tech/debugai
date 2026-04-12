import "dotenv/config";
import app from "./app.js";
import { initDB } from "./config/db.js";
import { log } from "./utils/logger.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // initDB now just initializes Supabase layer
    await initDB();
    log.info('PRODUCTION_READY', { db: 'Supabase/PostgreSQL' });
    
    app.listen(PORT, () => {
      log.info('SERVER_START', { port: PORT });
    });
  } catch (err) {
    log.error('SERVER_START_FAILED', { error: err.message });
    process.exit(1);
  }
}

startServer();
