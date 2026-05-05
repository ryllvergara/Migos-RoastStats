import { supabase } from '../supabaseAdmin';

export const clearTestData = async () => {
  const tables = ['audit_logs', 'sales_reports', 'sales', 'grill_count', 'branch_inventory', 'shifts', 'products', 'branches', 'users',];
  const cleanupPromises = tables.map(async (table) => {
    let query = supabase.from(table).delete();
    
    if (table === 'grill_count') {
      query = query.neq('product_id', -1); 
    } else {
      query = query.neq('id', 0);
    }
    const { error } = await query;    
    if (error) {
      console.error(`Cleanup error for ${table}:`, error.message);
    }
  });

  await Promise.all(cleanupPromises);
};