import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: path.resolve(__dirname, `../${envFile}`) });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbSchema = process.env.DB_SCHEMA || 'public';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase Environment Variables in Backend');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: dbSchema
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log(`[Supabase] Initialized using schema: ${dbSchema} (Mode: ${process.env.NODE_ENV || 'development'})`);