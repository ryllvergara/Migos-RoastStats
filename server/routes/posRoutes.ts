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
  const { branchId, employeeId } = req.body;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.toISOString();
  try {
    const { data: currentSales, error: fetchError } = await supabase
      .from('sales')
      .select(`id, product_id, branch_id, employee_id, product_name_at_sale, sold_price, sold_at`)
      .eq('branch_id', branchId)
      .eq('is_archived', false)
      .gte('sold_at', startOfToday);

    if (fetchError) throw fetchError;

    if (currentSales.length > 0) {
      await supabase
        .from('sales')
        .update({ is_archived: true })
        .eq('branch_id', branchId)
        .eq('is_archived', false);
    }

    const { data: grillData, error: grillFetchError } = await supabase
      .from('grill_count')
      .select('product_id, current_count')
      .eq('branch_id', branchId);

    if (grillFetchError) throw grillFetchError;

    const { data: activeShift, error: findShiftError } = await supabase
      .from('shifts')
      .select('id')
      .eq('branch_id', branchId)
      .eq('employee_id', employeeId)
      .is('clock_out_time', null)
      .single();

    if (findShiftError) throw findShiftError;

    const { data: inventoryData, error: invError } = await supabase
      .from('branch_inventory')
      .select('product_id, stock_quantity')
      .eq('branch_id', branchId);

    if (invError) throw invError;

    const reportMap = new Map();

    currentSales.forEach((sale: any) => {
      const key = `${sale.product_id}-${sale.sold_price}`;
      if (!reportMap.has(key)) {
        reportMap.set(key, {
          shift_id: activeShift.id,
          branch_id: branchId,
          product_id: sale.product_id,
          product_name: sale.product_name_at_sale,
          unit_price: sale.sold_price,
          quantity_sold: 0,
          product_revenue: 0,
          quantity_wasted: 0 ,
          stocks_remaining: 0
        });
      }
      const entry = reportMap.get(key);
      entry.quantity_sold += 1;
      entry.product_revenue += sale.sold_price;
    });

    inventoryData?.forEach((invItem) => {
      const matchingKey = Array.from(reportMap.keys()).find(k => k.startsWith(`${invItem.product_id}-`));
    
      if (matchingKey) {
        const entry = reportMap.get(matchingKey);
        entry.stocks_remaining = invItem.stock_quantity;
      } else {
        reportMap.set(`inv-${invItem.product_id}`, {
          shift_id: activeShift.id,
          branch_id: branchId,
          product_id: invItem.product_id,
          product_name: "Inventory Snapshot (No Sales)", 
          unit_price: 0, 
          quantity_sold: 0,
          product_revenue: 0,
          quantity_wasted: 0,
          stocks_remaining: invItem.stock_quantity
        });
      }
    });

    grillData?.forEach((grillItem) => {
      const matchingKey = Array.from(reportMap.keys()).find(k => k.startsWith(`${grillItem.product_id}-`));
      
      if (matchingKey) {
        reportMap.get(matchingKey).quantity_wasted = grillItem.current_count;
      }
    });

    const finalReports = Array.from(reportMap.values());
    if (finalReports.length > 0) {
      const { error: reportError } = await supabase.from('sales_reports').insert(finalReports);
      if (reportError) throw reportError;
    }

    const { error: resetError } = await supabase
    .from('grill_count')
    .update({ current_count: 0 })
    .eq('branch_id', branchId);

    if (resetError) throw resetError;

    await supabase
      .from('branches')
      .update({ last_audit_status: 'ready_for_audit' })
      .eq('id', branchId);

    const { error: shiftError } = await supabase
      .from('shifts')
      .update({ clock_out_time: new Date().toISOString() })
      .eq('id', activeShift.id);

    if (shiftError) throw shiftError;

    res.json({ 
      message: "Shift closed and clocked out successfully.", 
      shouldLogout: true,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;