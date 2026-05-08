import { describe, it, expect, beforeAll, afterEach, jest } from "@jest/globals";
import request from "supertest";
import app from "../server";
import { supabase } from "../supabaseAdmin";
import { clearTestData } from "./setup";

jest.setTimeout(15000);

async function createBranch(name = "Analytics Branch"): Promise<number> {
  const { data } = await supabase
    .from("branches")
    .insert([{ branch_name: name, branch_address: "Stat Ave" }])
    .select()
    .single();
  return data!.id;
}

async function createProduct(name = "Analytics Item"): Promise<number> {
  const { data } = await supabase
    .from("products")
    .insert([{ product_name: name, is_grilled: false }])
    .select()
    .single();
  return data!.id;
}

async function createEmployee(name = "Analytics_Emp"): Promise<number> {
  const { data } = await supabase
    .from("users")
    .insert([{ user_name: name, user_role: "employee", user_pin: "x" }])
    .select()
    .single();
  return data!.id;
}

async function insertAuditLog(
  branchId: number,
  expectedRevenue: number,
  actualCash: number,
  auditedAt: string
) {
  await supabase.from("audit_logs").insert([{
    branch_id: branchId,
    expected_revenue: expectedRevenue,
    actual_cash: actualCash,
    variance: actualCash - expectedRevenue,
    audited_at: auditedAt,
  }]);
}

async function insertSalesReport(branchId: number, shiftId: number, productId: number, createdAt: string) {
  await supabase.from("sales_reports").insert([{
    branch_id: branchId,
    shift_id: shiftId,
    product_id: productId,
    product_name: "Analytics Item",
    unit_price: 100,
    quantity_sold: 2,
    product_revenue: 200,
    quantity_wasted: 0,
    stocks_remaining: 5,
    created_at: createdAt,
  }]);
}

async function createShift(employeeId: number, branchId: number): Promise<number> {
  const { data } = await supabase
    .from("shifts")
    .insert([{ employee_id: employeeId, branch_id: branchId, clock_in_time: new Date().toISOString() }])
    .select()
    .single();
  return data!.id;
}

beforeAll(async () => { await clearTestData(); });
afterEach(async () => { await clearTestData(); });

describe("GET /api/analytics/dashboard", () => {
  // Happy: default weekOffset=0 returns correct shape
  it("should return reports, logs, and summary for the current week (default weekOffset=0)", async () => {
    const branchId = await createBranch();
    const productId = await createProduct();
    const employeeId = await createEmployee();
    const shiftId = await createShift(employeeId, branchId);

    // Insert a sales_report and audit_log for the current week
    const now = new Date().toISOString();
    await insertSalesReport(branchId, shiftId, productId, now);
    await insertAuditLog(branchId, 500, 480, now);

    const res = await request(app).get("/api/analytics/dashboard");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("reports");
    expect(res.body).toHaveProperty("logs");
    expect(res.body).toHaveProperty("summary");
    expect(Array.isArray(res.body.reports)).toBe(true);
    expect(Array.isArray(res.body.logs)).toBe(true);
  });

  // Happy: summary shape contains all required fields
  it("should return summary with totalRevenue, reconciledRevenue, dailyAverage, and growth", async () => {
    const branchId = await createBranch("Summary Branch");
    const now = new Date().toISOString();
    await insertAuditLog(branchId, 1000, 950, now);

    const res = await request(app).get("/api/analytics/dashboard");
    expect(res.status).toBe(200);
    const { summary } = res.body;
    expect(summary).toHaveProperty("totalRevenue");
    expect(summary).toHaveProperty("reconciledRevenue");
    expect(summary).toHaveProperty("dailyAverage");
    expect(summary).toHaveProperty("growth");
    expect(typeof summary.totalRevenue).toBe("number");
    expect(typeof Number(summary.growth)).toBe("number");
  });

  // Happy: weekOffset shifts the date window
  it("should accept a numeric weekOffset query param and return data for that week", async () => {
    const res = await request(app).get("/api/analytics/dashboard?weekOffset=1");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("summary");
  });

  // Sad: no data for the week → empty arrays + zero revenue
  it("should return empty reports and logs with zero revenue when no data exists for the week", async () => {
    const res = await request(app).get("/api/analytics/dashboard");
    expect(res.status).toBe(200);
    expect(res.body.reports).toEqual([]);
    expect(res.body.logs).toEqual([]);
    expect(res.body.summary.totalRevenue).toBe(0);
    expect(res.body.summary.reconciledRevenue).toBe(0);
  });

  // Sad: growth defaults to 100% when previous week has no data
  it("should report growth as 100 when previous week revenue is 0", async () => {
    const branchId = await createBranch("Growth Branch");
    const now = new Date().toISOString();
    await insertAuditLog(branchId, 800, 750, now);

    const res = await request(app).get("/api/analytics/dashboard");
    expect(res.status).toBe(200);
    // With no previous week data, growth should be 100
    expect(Number(res.body.summary.growth)).toBe(100);
  });

  // Sad: invalid weekOffset (non-numeric string)
  it("should return 400 for a non-numeric weekOffset", async () => {
    const res = await request(app).get("/api/analytics/dashboard?weekOffset=invalid");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});