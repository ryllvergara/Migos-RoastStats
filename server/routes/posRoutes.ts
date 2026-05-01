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
      .select('*, products(product_name, is_grilled), sold_price, users(user_name)')
      .eq('branch_id', branchId)
      .gte('sold_at', startOfToday)
      .order('sold_at', { ascending: false });
    if (salesError) throw salesError;
    const totalRevenue = salesData?.reduce((sum, s: any) => sum + (s.sold_price || 0), 0) || 0;
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
  const { productId, employeeId, productName, branchId, isGrilled } = req.body;
  if (!productId || !employeeId || !branchId) {
    return res.status(400).json({ error: 'Missing required fields: productId, employeeId, or branchId.' });
  }

  try {
    const { data: inventory, error: invError } = await supabase
      .from('branch_inventory')
      .select('branch_price, stock_quantity')
      .match({ product_id: productId, branch_id: branchId })
      .single();

    if (invError || !inventory) throw new Error('Product not found in branch inventory');
    if (inventory.stock_quantity <= 0) return res.status(400).json({ error: 'Out of stock!' });

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([{ 
        product_id: productId, 
        employee_id: employeeId, 
        branch_id: branchId,
        sold_price: inventory.branch_price,
        product_name_at_sale: productName
      }])
      .select().single();
    if (saleError) throw saleError;
    
    if (isGrilled) {
      const { error: grillError } = await supabase.rpc('adjust_grill_count', {
        p_product_id: productId,
        p_branch_id: branchId,
        p_delta: -1
      });
      if (grillError) throw grillError;
    } else {
      const { error: stockError } = await supabase.rpc('adjust_branch_stocks', {
        p_product_id: productId,
        p_branch_id: branchId,
        p_delta: -1
      });
      if (stockError) throw stockError;
    }
    res.status(201).json(sale);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH: Adjust Grill Count
router.patch('/grill-adjust', async (req, res) => {
    const { productId, branchId, delta } = req.body;
    try {
      const { error } = await supabase.rpc('adjust_grill_count', {
        p_product_id: Number(productId),
        p_branch_id: Number(branchId),
        p_delta: Number(delta)
      });
      if (error) throw error;

      const { error: updateError } = await supabase.rpc('adjust_branch_stocks', {
        p_product_id: Number(productId),
        p_branch_id: Number(branchId),
        p_delta: Number(-delta)
      });
      if (updateError) throw updateError;

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
      const { error: grillError } = await supabase.rpc('adjust_grill_count', {
        p_product_id: productId,
        p_branch_id: branchId,
        p_delta: 1
      });
      if (grillError) throw grillError;
    } else {
      const { error: stockError } = await supabase.rpc('adjust_branch_stocks', {
        p_product_id: productId,
        p_branch_id: branchId,
        p_delta: 1
      });
      if (stockError) throw stockError;
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Close Shift
router.post('/close-shift', async (req, res) => {
  const { branchId } = req.body;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.toISOString();
  try {
    const { data: currentSales, error: fetchError } = await supabase
      .from('sales')
      .select(`id, product_id, branch_id, employee_id, sold_price, sold_at`)
      .eq('branch_id', branchId)
      .gte('sold_at', startOfToday);
    if (fetchError) throw fetchError;
    if (!currentSales.length) return res.status(400).json({ message: "No sales to close." });

    const { error: updateError } = await supabase
      .from('sales')
      .update({ is_archived: true })
      .eq('branch_id', branchId)
      .gte('sold_at', startOfToday);
    if (updateError) throw updateError;

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