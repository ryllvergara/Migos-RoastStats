import { Router } from 'express';
import { supabase } from '../supabaseAdmin';

const router = Router();

// GET: Sync POS Data
router.get('/sync/:branchId', async (req, res) => {
  const { branchId } = req.params;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.toISOString();
  try {
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('*, products(product_name, product_price, is_grilled), users(user_name)')
      .eq('branch_id', branchId)
      .gte('created_at', startOfToday)
      .order('created_at', { ascending: false });
    if (salesError) throw salesError;
    const totalRevenue = salesData?.reduce((sum, s: any) => sum + (s.products?.product_price || 0), 0) || 0;
    const history = salesData?.slice(0, 5) || [];
    const { data: grillInventory, error: grillError } = await supabase
      .from('grill_count')
      .select('product_id, current_count')
      .eq('branch_id', branchId);
    if (grillError) throw grillError;
    res.json({ totalRevenue, history, grillInventory });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Record Sale
router.post('/sale', async (req, res) => {
  const { productId, employeeId, branchId, isGrilled } = req.body;
  try {
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([{ 
        product_id: productId, 
        employee_id: employeeId, 
        branch_id: branchId 
      }])
      .select().single();
    if (saleError) throw saleError;
    if (isGrilled) {
      await supabase.rpc('adjust_grill_count', {
        p_product_id: productId,
        p_branch_id: branchId,
        p_delta: -1
      });
    }
    res.status(201).json(sale);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH: Adjust Grill Count
router.patch('/grill-adjust', async (req, res) => {
  const productId = parseInt(req.body.productId);
  const branchId = parseInt(req.body.branchId);
  const delta = parseInt(req.body.delta);
  try {
    const { error } = await supabase.rpc('adjust_grill_count', {
      p_product_id: productId,
      p_branch_id: branchId,
      p_delta: delta
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("RPC Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Undo Sale
router.delete('/undo/:saleId', async (req, res) => {
  const { saleId } = req.params;
  const { productId, branchId, isGrilled } = req.body;
  try {
    const { error } = await supabase.from('sales').delete().eq('id', saleId);
    if (error) throw error;

    if (isGrilled) {
      await supabase.rpc('adjust_grill_count', {
        p_product_id: productId,
        p_branch_id: branchId,
        p_delta: 1
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Close Shift
router.post('/close-shift', async (req, res) => {
  const { branchId } = req.body;
  try {
    // Fetch today's sales for the branch to archive in history
    const { data: currentSales, error: fetchError } = await supabase
      .from('sales')
      .select(`*, products(product_price)`)
      .eq('branch_id', branchId);
    if (fetchError) throw fetchError;
    if (!currentSales.length) return res.status(400).json({ message: "No sales to close." });
    // Transform current sales into history data format
    const historyData = currentSales.map(s => ({
      sale_id: s.id,
      product_id: s.product_id,
      branch_id: s.branch_id,
      employee_id: s.employee_id,
      sale_price: s.products.product_price,
      sold_at: s.created_at
    }));
    // Insert into sales_history and then delete from sales
    const { error: insertError } = await supabase.from('sales_history').insert(historyData);
    if (insertError) throw insertError;
    const { error: deleteError } = await supabase.from('sales').delete().eq('branch_id', branchId);
    if (deleteError) throw deleteError;
    // Update branch status to indicate 'ready_for_audit'
    await supabase
      .from('branches')
      .update({ last_audit_status: 'ready_for_audit' })
      .eq('id', branchId);
    res.json({ message: "Shift closed successfully. Owner notified." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;