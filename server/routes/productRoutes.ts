import { Router } from 'express';
import { supabase } from '../supabaseAdmin.js';

const router = Router();

// GET all products
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('product_name', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST new product
router.post('/', async (req, res) => {
  const { product_name, product_price, is_grilled } = req.body;
  const { data, error } = await supabase
    .from('products')
    .insert([{ product_name, product_price, is_grilled: is_grilled || false }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT update product
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { product_name, product_price, is_grilled } = req.body;
  const { data, error } = await supabase
    .from('products')
    .update({ product_name, product_price, is_grilled })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
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