import express from 'express';
import { supabase } from '../supabaseAdmin';
import bcrypt from 'bcryptjs';

const router = express.Router();

// BRANCH ROUTES

// Get all branches
router.get('/branches', async (req, res) => {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('branch_name', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
// Create branch
router.post('/branches', async (req, res) => {
  const { branch_name, branch_address } = req.body;
  const { data, error } = await supabase
    .from('branches')
    .insert([{ branch_name, branch_address }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});
// Update branch
router.patch('/branches/:id', async (req, res) => {
  const { id } = req.params;
  const { branch_name, branch_address } = req.body;
  const { data, error } = await supabase
    .from('branches')
    .update({ branch_name, branch_address })
    .eq('id', id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});
// Delete branch
router.delete('/branches/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('branches')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// STAFF ROUTES

// Get all staff
router.get("/users", async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, user_name, user_role")
    .eq('user_role', 'employee')
    .order('user_name', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
// Update Staff
router.patch('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { user_name, user_pin, user_role } = req.body;
  try {const updateData: any = { 
    user_name, 
    user_role: user_role?.toLowerCase(),
  };
  if (user_pin && user_pin.trim() !== "") {
    const salt = await bcrypt.genSalt(10);
    updateData.user_pin = await bcrypt.hash(user_pin, salt);
  }
  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select();
  if (error) throw error;
  res.json(data[0]);
} catch (err: any) {
  res.status(500).json({ error: err.message });
}});
// Delete Staff
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;