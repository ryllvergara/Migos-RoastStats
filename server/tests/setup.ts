import { supabase } from '../supabaseAdmin';

export const clearTestData = async () => {
  const orderedTables: Array<{ table: string; column: string; value: any }> = [
    { table: 'sales_reports',    column: 'id',         value: 0 },
    { table: 'sales',            column: 'id',         value: 0 },
    { table: 'audit_logs',       column: 'id',         value: 0 },
    { table: 'grill_count',      column: 'product_id', value: -1 },
    { table: 'branch_inventory', column: 'id',         value: 0 },
    { table: 'shifts',           column: 'id',         value: 0 },
    { table: 'products',         column: 'id',         value: 0 },
    { table: 'branches',         column: 'id',         value: 0 },
    { table: 'users',            column: 'id',         value: 0 },
  ];

  // Run sequentially so each parent is only deleted after all its children are gone.
  for (const { table, column, value } of orderedTables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq(column, value);

    if (error) {
      console.error(`Cleanup error for ${table}:`, error.message);
    }
  }
};