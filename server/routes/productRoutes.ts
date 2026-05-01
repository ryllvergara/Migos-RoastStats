import { Router } from 'express';
import { supabase } from '../supabaseAdmin.js';

const router = Router();

// GET all products for a specific branch
router.get('/branch/:branchId', async (req, res) => {
  const { branchId } = req.params;
  const { data, error } = await supabase
    .from('branch_inventory')
    .select(`
      id,
      branch_price,
      stock_quantity,
      products (
        id,
        product_name,
        is_grilled
      )
    `)
    .eq('branch_id', branchId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST new product
router.post('/branch-assign', async (req, res) => {
  const { product_name, branch_price, is_grilled, branchId, initial_stock } = req.body;

  if (!product_name || !branch_price || !branchId) {
    return res.status(400).json({ error: "Missing required fields for branch assignment" });
  }

  try {
    let { data: product, error: pError } = await supabase
      .from('products')
      .select('*')
      .eq('product_name'.toLowerCase(), product_name.toLowerCase())
      .maybeSingle();

    if (pError) throw pError;

    if (!product) {
      const insertResult = await supabase
        .from('products')
        .insert([{ product_name, is_grilled }])
        .select()
        .single();

      product = insertResult.data;
      if (insertResult.error) throw insertResult.error;
    }

    const { data: inventory, error: iError } = await supabase
      .from('branch_inventory')
      .insert([{
        branch_id: branchId,
        product_id: product.id,
        branch_price: branch_price,
        stock_quantity: initial_stock || 0
      }])
      .select()
      .single();

    if (iError) throw iError;

    res.status(201).json({ product, inventory });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update product
router.patch('/inventory/:inventoryId', async (req, res) => {
  const { inventoryId } = req.params;
  const { branch_price, stock_quantity } = req.body;

  const { data, error } = await supabase
    .from('branch_inventory')
    .update({ branch_price, stock_quantity })
    .eq('id', inventoryId)
    .select()
    .single();

  if (!data) return res.status(404).json({ error: "Product not found" });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH adjust stock quantity
router.patch('/update-stock', async (req, res) => {
  const { branchId, productId, quantityChange } = req.body; 

  const { error } = await supabase.rpc('decrement_stock', {
    b_id: branchId,
    p_id: productId,
    amount: quantityChange 
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// DELETE product
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    console.error("Supabase Delete Error:", error);
    return res.status(500).json({ error: error.message });
  }

  res.status(204).send(); 
});

export default router;