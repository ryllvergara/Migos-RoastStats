import express from 'express';
import { supabase } from '../supabaseAdmin';

const router = express.Router();

// GET: Detailed audit data for a specific branch
router.get('/details/:branchId', async (req, res) => {
  const { branchId } = req.params;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.toISOString();

  try {
    const { data: reports, error: reportError } = await supabase
      .from('sales_reports')
      .select(`
        product_name,
        unit_price,
        quantity_sold,
        product_revenue,
        quantity_wasted,
        stocks_remaining,
        shifts (
          users (
            user_name
          )
        )
      `)
      .eq('branch_id', branchId)
      .gte('created_at', startOfToday);

    if (reportError) throw reportError;

    if (!reports || reports.length === 0) {
      return res.json({ products: [], employees: [], totalExpected: 0 });
    }

    const productSummary = reports.map(r => ({
      name: r.product_name,
      unitsSold: r.quantity_sold,
      pricePerUnit: r.unit_price,
      revenue: r.product_revenue,
      wastage: r.quantity_wasted,
      remainingStocks: r.stocks_remaining
    }));

    const staffNames = new Set();
    reports.forEach((r: any) => {
      const name = r.shifts?.users?.user_name;
      if (name) staffNames.add(name);
    });

    const totalExpected = reports.reduce((sum, r) => sum + (r.product_revenue || 0), 0);

    res.json({
      products: productSummary,
      employees: Array.from(staffNames).map(name => ({ name })),
      totalExpected: totalExpected
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Finalize and Reset Branch Status
router.post('/finalize', async (req, res) => {
  const { branchId, actualCash, expectedCash, variance } = req.body;

  try {
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert([{
        branch_id: branchId,
        expected_revenue: expectedCash,
        actual_cash: actualCash,
        variance: variance,
        audited_at: new Date().toISOString()
      }]);

    if (logError) throw logError;

    const { error: branchError } = await supabase
      .from('branches')
      .update({ last_audit_status: 'active' })
      .eq('id', branchId);

    if (branchError) throw branchError;

    res.json({ success: true, message: "Audit finalized and branch reset." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;