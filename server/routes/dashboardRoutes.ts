import express from 'express';
import { supabase } from '../supabaseAdmin';

const router = express.Router();

// GET: Dashboard Overview
router.get('/overview', async (req, res) => {
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

      // Calculate Revenue based on Audit Status
      if (branch.last_audit_status === 'ready_for_audit') {
        const { data: historySales } = await supabase
          .from('sales_history')
          .select('product_name, sale_price, sold_at, archived_at')
          .eq('branch_id', branch.id)
          .gte('sold_at', startOfToday)
          .order('sold_at', { ascending: false });

        revenue = historySales?.reduce((sum, s) => sum + (Number(s.sale_price) || 0), 0) || 0;
        
        if (historySales && historySales.length > 0) {
          latestSale = {
            product_name: historySales[0].product_name,
            created_at: historySales[0].sold_at
          };
          lastActivity = historySales[0].archived_at;
        }

      } else {
        // For active branches, calculate revenue from live sales
        const { data: liveSales } = await supabase
          .from('sales')
          .select(`created_at, products(product_name, product_price)`)
          .eq('branch_id', branch.id)
          .gte('created_at', startOfToday)
          .order('created_at', { ascending: false });

        revenue = liveSales?.reduce((sum, sale: any) => {
          return sum + (Number(sale.products?.product_price) || 0);
        }, 0) || 0;

        if (liveSales && liveSales.length > 0) {
          const topSale: any = liveSales[0];
          latestSale = {
            product_name: topSale.products?.product_name,
            created_at: topSale.created_at
          };
          lastActivity = topSale.created_at;
        }
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