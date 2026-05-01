import express from 'express';
import { supabase } from '../supabaseAdmin';

const router = express.Router();

// GET: Dashboard Overview
router.get('/overview', async (_req, res) => {
  try {
    const { data: branches, error: bError } = await supabase
      .from('branches')
      .select('id, branch_name, created_at, last_audit_status')
      .order('branch_name', { ascending: true });   
    if (bError) throw bError;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfToday = today.toISOString();
    
    const dashboardData = await Promise.all(branches.map(async (branch) => {
      let revenue = 0;
      let lastActivity: string | null = null;
      let latestSale: any = null;

      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('product_name_at_sale, sold_price, sold_at, is_archived, products(product_name)')
        .eq('branch_id', branch.id)
        .gte('sold_at', startOfToday)
        .order('sold_at', { ascending: false });
      if (salesError) throw salesError;

      revenue = sales?.reduce((sum, s) => sum + (Number(s.sold_price) || 0), 0) || 0;

      const latestSaleData = sales?.[0];
      if (latestSaleData) {
        latestSale = {
          product_name: latestSaleData.product_name_at_sale,
          sold_at: latestSaleData.sold_at
        };
        lastActivity = latestSaleData.sold_at;
      }

      // Fetch Grill Status
      const { data: grillData } = await supabase
        .from('grill_count')
        .select(`
          current_count,
          updated_at,
          products!inner (
            product_name,
            is_grilled
          )
        `)
        .eq('branch_id', branch.id)
        .eq('products.is_grilled', true);

      // Determine the most recent update time between grill and sales activity
      const lastGrillUpdate = grillData?.length 
        ? Math.max(...grillData.map(g => new Date(g.updated_at || 0).getTime())) 
        : 0;
      
      const activityTimestamp = lastActivity ? new Date(lastActivity).getTime() : 0;
      const finalTimestamp = Math.max(lastGrillUpdate, activityTimestamp);
      
      const lastUpdate = finalTimestamp > 0 
        ? new Date(finalTimestamp).toISOString() 
        : branch.created_at;

      return {
        id: branch.id,
        name: branch.branch_name,
        revenue: revenue,
        auditStatus: branch.last_audit_status || 'active',
        grillStatus: { 
          items: grillData?.map((g: any) => ({
            product_name: g.products?.product_name,
            current_count: Number(g.current_count || 0)
          })) || []
        },
        latestSale: latestSale,
        lastUpdate: lastUpdate,
      };
    }));

    res.json(dashboardData);
  } catch (err: any) {
    console.error("Dashboard API Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;