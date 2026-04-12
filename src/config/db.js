import { supabase } from "./supabase.js";
import { log } from "../utils/logger.js";

// Exporting a consistent interface for the rest of the app
export const getDB = () => ({
  // Simplified wrapper for profiles table
  profiles: {
    async get(userId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
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
      // Direct RPC or update logic
      const { data, error } = await supabase.rpc('increment_analyses', { user_id: userId });
      
      if (error) {
        // Fallback if RPC not yet created: manual fetch and update
        const profile = await this.get(userId);
        if (profile) {
          return await this.update(userId, { 
            analyses_count: (profile.analyses_count || 0) + 1,
            last_analysis_at: new Date().toISOString()
          });
        }
      }
      return data;
    }
  }
});

// For compatibility during migration
export async function initDB() {
  log.info('Supabase initialized as primary DB secondary to SQLite depreciation');
  return true;
}
