import express from 'express';
import { supabase } from '../supabaseAdmin';
import { startOfWeek, endOfWeek, subWeeks, formatISO } from 'date-fns';

const router = express.Router();

router.get('/dashboard', async (req: any, res: any) => {
  const { weekOffset = 0 } = req.query;
  
  // Calculate date range for the target week 
  const targetDate = subWeeks(new Date(), Number(weekOffset));
  const start = formatISO(startOfWeek(targetDate, { weekStartsOn: 1 }));
  const end = formatISO(endOfWeek(targetDate, { weekStartsOn: 1 }));
  
  // Past Week for Growth Calculation
  const prevStart = formatISO(subWeeks(new Date(start), 1));
  const prevEnd = formatISO(subWeeks(new Date(end), 1));

  try {
    // Current Week Reports
    const { data: currentReports, error: currErr } = await supabase
      .from('sales_reports')
      .select('*, branches(branch_name)')
      .gte('created_at', start)
      .lte('created_at', end);

    if (currErr) throw currErr;

    // Previous Week Revenue (for growth %)
    const { data: prevReports } = await supabase
      .from('audit_logs')
      .select('expected_revenue, actual_cash')
      .gte('audited_at', prevStart)
      .lte('audited_at', prevEnd);

    // Audit Logs for the week
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*, branches(branch_name), expected_revenue, actual_cash')
      .gte('audited_at', start)
      .lte('audited_at', end)
      .order('audited_at', { ascending: false });

    // Revenue Calculations
    const grossSalesRevenue = auditLogs?.reduce((sum, r) => sum + r.expected_revenue, 0) || 0;
    const reconciledCashRevenue = auditLogs?.reduce((sum, r) => sum + r.actual_cash, 0) || 0;
    const prevGrossRevenue = prevReports?.reduce((sum, r) => sum + r.expected_revenue, 0) || 0;

    // Growth % logic
    const growth = prevGrossRevenue === 0 ? 100 : ((grossSalesRevenue - prevGrossRevenue) / prevGrossRevenue) * 100;

    res.json({
      reports: currentReports,
      logs: auditLogs,
      summary: {
        totalRevenue: grossSalesRevenue,
        reconciledRevenue: reconciledCashRevenue,
        dailyAverage: grossSalesRevenue / 7 || 0,
        growth: growth.toFixed(2),
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;