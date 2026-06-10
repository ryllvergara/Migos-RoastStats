import { describe, it, expect, beforeAll, afterEach, jest } from "@jest/globals";
import request from "supertest";
import app from "../server";
import { supabase } from "../supabaseAdmin";
import { clearTestData } from "./setup";

jest.setTimeout(15000);

async function createBranch(name = "Audit Branch", status = "active"): Promise<number> {
  const { data } = await supabase
    .from("branches")
    .insert([{ branch_name: name, branch_address: "Test St", last_audit_status: status }])
    .select()
    .single();
  return data!.id;
}

async function createProduct(productName = "Test Chicken", isGrilled = false): Promise<number> {
  const { data } = await supabase
    .from("products")
    .insert([{ product_name: productName, is_grilled: isGrilled }])
    .select()
    .single();
  return data!.id;
}

async function createUser(userName = "Audit_Employee"): Promise<number> {
  const { data } = await supabase
    .from("users")
    .insert([{ user_name: userName, user_role: "employee", user_pin: "hashed_pin" }])
    .select()
    .single();
  return data!.id;
}

async function seedSalesReport(branchId: number): Promise<void> {
  const userId = await createUser();
  const { data: shift } = await supabase
    .from("shifts")
    .insert([{ employee_id: userId, branch_id: branchId, clock_in_time: new Date().toISOString() }])
    .select()
    .single();

  const productId = await createProduct();

  await supabase.from("sales_reports").insert([{
    branch_id: branchId,
    shift_id: shift!.id,
    product_id: productId,
    product_name: "Test Chicken",
    unit_price: 100,
    quantity_sold: 3,
    product_revenue: 300,
    quantity_wasted: 1,
    stocks_remaining: 5,
    created_at: new Date().toISOString(),
  }]);
}

beforeAll(async () => { await clearTestData(); });
afterEach(async () => { await clearTestData(); });

describe("GET /api/audit/details/:branchId", () => {
  // Happy: branch with today's reports -- products + employees + totalExpected
  it("should return product summary, employees, and totalExpected for a branch with today's reports", async () => {
    const branchId = await createBranch();
    await seedSalesReport(branchId);

    const res = await request(app).get(`/api/audit/details/${branchId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("products");
    expect(res.body).toHaveProperty("employees");
    expect(res.body).toHaveProperty("totalExpected");
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products[0]).toMatchObject({
      name: expect.any(String),
      unitsSold: expect.any(Number),
      pricePerUnit: expect.any(Number),
      revenue: expect.any(Number),
    });
    expect(res.body.totalExpected).toBeGreaterThan(0);
  });

  // Happy: branch with no reports today → empty arrays + totalExpected 0
  it("should return empty arrays and totalExpected 0 when branch has no today's reports", async () => {
    const branchId = await createBranch("Empty Branch");
    const res = await request(app).get(`/api/audit/details/${branchId}`);
    expect(res.status).toBe(200);
    expect(res.body.products).toEqual([]);
    expect(res.body.employees).toEqual([]);
    expect(res.body.totalExpected).toBe(0);
  });

  // Sad: non-existent branchId (no Supabase error, just empty)
  it("should return empty result for a non-existent branchId", async () => {
    const res = await request(app).get("/api/audit/details/99999999");
    expect(res.status).toBe(200);
    expect(res.body.products).toEqual([]);
    expect(res.body.totalExpected).toBe(0);
  });

  // Sad: non-numeric branchId that causes a DB error 
  it("should return 500 for a completely invalid (non-numeric) branchId that the DB rejects", async () => {
    const res = await request(app).get("/api/audit/details/not-a-number");
    expect([400, 500]).toContain(res.status);
  });
});

describe("POST /api/audit/finalize", () => {
  // Happy: valid payload -- audit_log inserted + branch status = 'audited'
  it("should insert an audit_log and set branch status to 'audited'", async () => {
    const branchId = await createBranch("Finalize Branch", "ready_for_audit");
    const payload = {
      branchId,
      actualCash: 950,
      expectedCash: 1000,
      variance: -50,
    };

    const res = await request(app).post("/api/audit/finalize").send(payload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Audit finalized and branch reset.");

    // Verify audit_log row exists
    const { data: logs } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("branch_id", branchId);
    expect(logs).toHaveLength(1);
    expect(logs![0].expected_revenue).toBe(1000);
    expect(logs![0].actual_cash).toBe(950);
    expect(logs![0].variance).toBe(-50);

    // Verify branch status
    const { data: branch } = await supabase
      .from("branches")
      .select("last_audit_status")
      .eq("id", branchId)
      .single();
    expect(branch?.last_audit_status).toBe("audited");
  });

  // Happy: zero variance (balanced cash) accepted
  it("should finalize successfully when actualCash equals expectedCash (zero variance)", async () => {
    const branchId = await createBranch("Balanced Branch", "ready_for_audit");
    const res = await request(app).post("/api/audit/finalize").send({
      branchId,
      actualCash: 500,
      expectedCash: 500,
      variance: 0,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // Sad: missing branchId 
  it("should return 500 when branchId is missing from the payload", async () => {
    const res = await request(app).post("/api/audit/finalize").send({
      actualCash: 100,
      expectedCash: 100,
      variance: 0,
    });
    expect(res.status).toBe(500);
  });

  // Sad: non-existent branchId 
  it("should return 500 when branchId references a non-existent branch", async () => {
    const res = await request(app).post("/api/audit/finalize").send({
      branchId: 99999999,
      actualCash: 100,
      expectedCash: 100,
      variance: 0,
    });
    expect(res.status).toBe(500);
  });

  // Sad: empty body 
  it("should return 500 when the request body is completely empty", async () => {
    const res = await request(app).post("/api/audit/finalize").send({});
    expect(res.status).toBe(500);
  });
});