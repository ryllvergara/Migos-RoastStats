import { Router } from 'express';
import { supabase } from '../supabaseAdmin';

const router = Router();

// GET: Sync POS Data
router.get('/sync/:branchId', async (req, res) => {
  const { branchId } = req.params;
  try {
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('*, products(product_name, product_price, is_grilled), users(user_name)')
      .eq('branch_id', branchId)
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

export default router;