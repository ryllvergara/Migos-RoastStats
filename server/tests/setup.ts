import { supabase } from '../supabaseAdmin';

export const clearTestData = async () => {
  const tables = ['users', 'sales', 'sales_history', 'branches', 'grill_count', 'products', 'shifts'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq("id", "-1");    
    if (error) {
      console.error(`Cleanup error for ${table}:`, error.message);
    }
  }
};