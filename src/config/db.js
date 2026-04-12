import { supabase } from "./supabase.js";
import { log } from "../utils/logger.js";

// [MIGRATION-2026] Supabase Native Interface
// This replaces the old SQLite logic with a fluent API for Supabase tables.

export const getDB = () => ({
  // Profiles (Formerly 'users' table)
  profiles: {
    async get(userId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // Ignore "not found" error
        log.error('DB_GET_PROFILE_ERROR', { userId, error });
        return null;
      }
      return data;
    },
    
    async update(userId, updates) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        log.error('DB_UPDATE_PROFILE_ERROR', { userId, error });
        throw error;
      }
      return data;
    },

    async incrementAnalyses(userId) {
      const { data: profile } = await supabase.from('profiles').select('analyses_count').eq('id', userId).single();
      const count = (profile?.analyses_count || 0) + 1;
      return await this.update(userId, { 
        analyses_count: count,
        last_analysis_at: new Date().toISOString()
      });
    }
  },

  // Payments Logic
  payments: {
    async register({ paymentId, provider, userId, type, amountCents, tokensGranted }) {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          payment_id: String(paymentId),
          provider,
          user_id: userId,
          type,
          amount_cents: amountCents,
          tokens_granted: tokensGranted || 0
        });
      
      if (error) {
        log.error('DB_REGISTER_PAYMENT_ERROR', { paymentId, error });
        throw error;
      }
      return data;
    },

    async exists(paymentId) {
      const { data, error } = await supabase
        .from('payments')
        .select('payment_id')
        .eq('payment_id', String(paymentId))
        .single();
      return !!data;
    }
  },

  // Events/Tracking Logic
  events: {
    async track(userId, type, metadata = {}) {
      const { error } = await supabase
        .from('eventos')
        .insert({
          user_id: userId,
          tipo_evento: type,
          metadata: metadata
        });
      
      if (error) log.error('DB_TRACK_EVENT_ERROR', { userId, type, error });
    }
  },

  // [COMPATIBILITY] Fallback for legacy raw SQL calls
  async get(sql, params) { 
    log.error('LEGACY_SQL_CALL_BLOCKED', { sql, params, type: 'get' }); 
    return null; 
  },
  async all(sql, params) { 
    log.error('LEGACY_SQL_CALL_BLOCKED', { sql, params, type: 'all' }); 
    return []; 
  },
  async run(sql, params) { 
    log.error('LEGACY_SQL_CALL_BLOCKED', { sql, params, type: 'run' }); 
    return { changes: 0 }; 
  }
});

export async function initDB() {
  log.info('Supabase initialized as primary DB secondary to SQLite depreciation');
  return true;
}
