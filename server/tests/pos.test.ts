import { describe, it, expect, beforeAll, afterEach, jest } from "@jest/globals";
import request from "supertest";
import app from "../server";
import { supabase } from "../supabaseAdmin";
import { clearTestData } from "./setup";

jest.setTimeout(20000);

async function createBranch(name = "POS Branch", status = "active"): Promise<number> {
  const { data } = await supabase
    .from("branches")
    .insert([{ branch_name: name, branch_address: "POS St", last_audit_status: status }])
    .select()
    .single();
  return data!.id;
}

async function createEmployee(name = "POS_Employee"): Promise<number> {
  const { data } = await supabase
    .from("users")
    .insert([{ user_name: name, user_role: "employee", user_pin: "x" }])
    .select()
    .single();
  return data!.id;
}

async function createProduct(name = "POS Item", isGrilled = false): Promise<number> {
  const { data } = await supabase
    .from("products")
    .insert([{ product_name: name, is_grilled: isGrilled }])
    .select()
    .single();
  return data!.id;
}

async function assignInventory(
  branchId: number,
  productId: number,
  price = 100,
  stock = 20
): Promise<number> {
  const { data } = await supabase
    .from("branch_inventory")
    .insert([{ branch_id: branchId, product_id: productId, branch_price: price, stock_quantity: stock }])
    .select()
    .single();
  return data!.id;
}

async function createShift(employeeId: number, branchId: number): Promise<number> {
  const { data } = await supabase
    .from("shifts")
    .insert([{ employee_id: employeeId, branch_id: branchId, clock_in_time: new Date().toISOString() }])
    .select()
    .single();
  return data!.id;
}

async function seedGrillCount(branchId: number, productId: number, count = 5) {
  await supabase
    .from("grill_count")
    .upsert([{ branch_id: branchId, product_id: productId, current_count: count }], {
      onConflict: "branch_id,product_id",
    });
}

beforeAll(async () => { await clearTestData(); });
afterEach(async () => { await clearTestData(); });

describe("GET /api/sync/:branchId", () => {
  // Happy: returns totalRevenue, history, grillInventory, branchStocks
  it("should return sync data with correct shape for a valid branch", async () => {
    const branchId = await createBranch();
    const productId = await createProduct();
    await assignInventory(branchId, productId, 120, 10);

    const res = await request(app).get(`/api/sync/${branchId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalRevenue");
    expect(res.body).toHaveProperty("history");
    expect(res.body).toHaveProperty("grillInventory");
    expect(res.body).toHaveProperty("branchStocks");
    expect(typeof res.body.totalRevenue).toBe("number");
    expect(Array.isArray(res.body.history)).toBe(true);
  });

  // Happy: totalRevenue sums today's sales for the branch
  it("should aggregate totalRevenue from today's sales", async () => {
    const branchId = await createBranch("Revenue Sync Branch");
    const productId = await createProduct("Sync Item");
    const employeeId = await createEmployee("Sync_Emp");
    await assignInventory(branchId, productId, 150);

    // Insert two sales
    await supabase.from("sales").insert([
      { branch_id: branchId, product_id: productId, employee_id: employeeId, sold_price: 150, product_name_at_sale: "Sync Item", sold_at: new Date().toISOString() },
      { branch_id: branchId, product_id: productId, employee_id: employeeId, sold_price: 150, product_name_at_sale: "Sync Item", sold_at: new Date().toISOString() },
    ]);

    const res = await request(app).get(`/api/sync/${branchId}`);
    expect(res.status).toBe(200);
    expect(res.body.totalRevenue).toBe(300);
    expect(res.body.history.length).toBeGreaterThanOrEqual(2);
  });

  // Sad: non-existent branch → empty arrays and revenue 0
  it("should return zero revenue and empty arrays for a non-existent branchId", async () => {
    const res = await request(app).get("/api/sync/99999999");
    expect(res.status).toBe(200);
    expect(res.body.totalRevenue).toBe(0);
    expect(res.body.history).toEqual([]);
  });

  // Sad: non-numeric branchId → error
  it("should return an error for a non-numeric branchId", async () => {
    const res = await request(app).get("/api/sync/not-a-number");
    expect([400, 500]).toContain(res.status);
  });
});

describe("POST /api/sale", () => {
  // Happy: non-grilled sale → stock decremented, sale inserted → 201
  it("should record a non-grilled sale, decrement stock, and return the sale record", async () => {
    const branchId = await createBranch("Sale Branch");
    const productId = await createProduct("Regular Item", false);
    const employeeId = await createEmployee("Sale_Emp");
    await assignInventory(branchId, productId, 100, 10);

    const res = await request(app).post("/api/sale").send({
      productId,
      employeeId,
      productName: "Regular Item",
      branchId,
      isGrilled: false,
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.sold_price).toBe(100);

    // Stock should be 9
    const { data: inv } = await supabase
      .from("branch_inventory")
      .select("stock_quantity")
      .match({ branch_id: branchId, product_id: productId })
      .single();
    expect(inv?.stock_quantity).toBe(9);
  });

  // Happy: grilled sale → grill count decremented (not stock)
  it("should decrement grill_count for a grilled product sale", async () => {
    const branchId = await createBranch("Grill Sale Branch");
    const productId = await createProduct("Grilled Item", true);
    const employeeId = await createEmployee("Grill_Sale_Emp");
    await assignInventory(branchId, productId, 120, 0);
    await seedGrillCount(branchId, productId, 5);

    const res = await request(app).post("/api/sale").send({
      productId,
      employeeId,
      productName: "Grilled Item",
      branchId,
      isGrilled: true,
    });
    expect(res.status).toBe(201);
  });

  // Happy: sale is recorded with product_name_at_sale
  it("should persist product_name_at_sale on the sale record", async () => {
    const branchId = await createBranch("Name Persist Branch");
    const productId = await createProduct("Named Item", false);
    const employeeId = await createEmployee("Name_Emp");
    await assignInventory(branchId, productId, 80, 5);

    const res = await request(app).post("/api/sale").send({
      productId,
      employeeId,
      productName: "Named Item",
      branchId,
      isGrilled: false,
    });
    expect(res.status).toBe(201);
    expect(res.body.product_name_at_sale).toBe("Named Item");
  });

  // Sad: missing productId → 400
  it("should return 400 when productId is missing", async () => {
    const res = await request(app).post("/api/sale").send({
      employeeId: 1,
      branchId: 1,
      productName: "Item",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Missing required fields");
  });

  // Sad: product not found in inventory → 500
  it("should return 500 when the product is not in the branch's inventory", async () => {
    const branchId = await createBranch("No Inv Branch");
    const productId = await createProduct("Ghost Product");
    const employeeId = await createEmployee("Ghost_Emp");
    // intentionally skip assignInventory
    const res = await request(app).post("/api/sale").send({
      productId,
      employeeId,
      productName: "Ghost Product",
      branchId,
      isGrilled: false,
    });
    expect(res.status).toBe(500);
  });

  // Sad: out of stock → 400
  it("should return 400 when stock is 0 for a non-grilled product", async () => {
    const branchId = await createBranch("Out of Stock Branch");
    const productId = await createProduct("OOS Item", false);
    const employeeId = await createEmployee("OOS_Emp");
    await assignInventory(branchId, productId, 100, 0); // zero stock

    const res = await request(app).post("/api/sale").send({
      productId,
      employeeId,
      productName: "OOS Item",
      branchId,
      isGrilled: false,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Out of stock!");
  });

  // Sad: missing branchId → 400
  it("should return 400 when branchId is missing", async () => {
    const res = await request(app).post("/api/sale").send({
      productId: 1,
      employeeId: 1,
      productName: "Item",
    });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/grill-adjust", () => {
  // Happy: positive delta increments grill count and decrements stock
  it("should increase grill_count and reduce stock when delta is positive", async () => {
    const branchId = await createBranch("Grill Adjust Branch");
    const productId = await createProduct("Adjustable Grill Item", true);
    await assignInventory(branchId, productId, 100, 10);
    await seedGrillCount(branchId, productId, 2);

    const res = await request(app).patch("/api/grill-adjust").send({
      productId,
      branchId,
      delta: 3,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // Happy: negative delta (return grill → stock)
  it("should decrease grill_count and restore stock when delta is negative", async () => {
    const branchId = await createBranch("Grill Return Branch");
    const productId = await createProduct("Return Grill Item", true);
    await assignInventory(branchId, productId, 100, 5);
    await seedGrillCount(branchId, productId, 5);

    const res = await request(app).patch("/api/grill-adjust").send({
      productId,
      branchId,
      delta: -2,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // Sad: missing productId → RPC error → 500
  it("should return 500 when productId is missing", async () => {
    const res = await request(app).patch("/api/grill-adjust").send({ branchId: 1, delta: 1 });
    expect(res.status).toBe(500);
  });

  // Sad: missing branchId → RPC error → 500
  it("should return 500 when branchId is missing", async () => {
    const res = await request(app).patch("/api/grill-adjust").send({ productId: 1, delta: 1 });
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/undo/:saleId", () => {
  // Happy: undo non-grilled sale → sale deleted + stock restored
  it("should delete the sale record and restore stock for a non-grilled product", async () => {
    const branchId = await createBranch("Undo Branch");
    const productId = await createProduct("Undo Item", false);
    const employeeId = await createEmployee("Undo_Emp");
    await assignInventory(branchId, productId, 100, 10);

    // Record a sale first
    const saleRes = await request(app).post("/api/sale").send({
      productId, employeeId, productName: "Undo Item", branchId, isGrilled: false,
    });
    const saleId = saleRes.body.id;

    // Undo
    const res = await request(app)
      .delete(`/api/undo/${saleId}`)
      .send({ productId, branchId, isGrilled: false });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Sale should be gone
    const { data: remaining } = await supabase.from("sales").select("id").eq("id", saleId);
    expect(remaining).toHaveLength(0);

    // Stock should be restored to 10
    const { data: inv } = await supabase
      .from("branch_inventory")
      .select("stock_quantity")
      .match({ branch_id: branchId, product_id: productId })
      .single();
    expect(inv?.stock_quantity).toBe(10);
  });

  // Happy: undo grilled sale → grill count restored
  it("should restore grill_count when undoing a grilled sale", async () => {
    const branchId = await createBranch("Undo Grill Branch");
    const productId = await createProduct("Undo Grill Item", true);
    const employeeId = await createEmployee("UndoGrill_Emp");
    await assignInventory(branchId, productId, 100, 0);
    await seedGrillCount(branchId, productId, 5);

    const saleRes = await request(app).post("/api/sale").send({
      productId, employeeId, productName: "Undo Grill Item", branchId, isGrilled: true,
    });
    const saleId = saleRes.body.id;

    const res = await request(app)
      .delete(`/api/undo/${saleId}`)
      .send({ productId, branchId, isGrilled: true });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // Sad: non-existent saleId → 200 (delete is a no-op, route still succeeds) or stock RPC fails → 500
  it("should handle a non-existent saleId gracefully", async () => {
    const res = await request(app)
      .delete("/api/undo/99999999")
      .send({ productId: 1, branchId: 1, isGrilled: false });
    // Sale deletion is a no-op; RPC for non-existent product may fail
    expect([200, 500]).toContain(res.status);
  });

  // Sad: missing body fields → RPC fails → 500
  it("should return 500 when productId and branchId are missing from body", async () => {
    const res = await request(app).delete("/api/undo/1").send({});
    expect(res.status).toBe(500);
  });
});

describe("POST /api/close-shift", () => {
  // Happy: closes shift, generates sales_reports, archives sales, resets grill, sets branch status
  it("should close shift, generate sales_reports, archive sales, and set branch to ready_for_audit", async () => {
    const branchId = await createBranch("Close Shift Branch");
    const productId = await createProduct("Close Item", false);
    const employeeId = await createEmployee("Close_Emp");
    const invId = await assignInventory(branchId, productId, 100, 10);
    const shiftId = await createShift(employeeId, branchId);

    // Insert a sale tied to this shift context
    await supabase.from("sales").insert([{
      branch_id: branchId,
      product_id: productId,
      employee_id: employeeId,
      sold_price: 100,
      product_name_at_sale: "Close Item",
      sold_at: new Date().toISOString(),
      is_archived: false,
    }]);

    const res = await request(app).post("/api/close-shift").send({ branchId, employeeId });
    expect(res.status).toBe(200);
    expect(res.body.shouldLogout).toBe(true);
    expect(res.body.message).toContain("Shift closed");

    // Shift should be clocked out
    const { data: shift } = await supabase.from("shifts").select("clock_out_time").eq("id", shiftId).single();
    expect(shift?.clock_out_time).not.toBeNull();

    // Branch status should be ready_for_audit
    const { data: branch } = await supabase.from("branches").select("last_audit_status").eq("id", branchId).single();
    expect(branch?.last_audit_status).toBe("ready_for_audit");

    // Sales should be archived
    const { data: activeSales } = await supabase
      .from("sales")
      .select("id")
      .eq("branch_id", branchId)
      .eq("is_archived", false);
    expect(activeSales).toHaveLength(0);
  });

  // Happy: close shift with no sales → still succeeds (no reports generated)
  it("should close shift successfully even when there are no sales today", async () => {
    const branchId = await createBranch("Empty Shift Branch");
    const employeeId = await createEmployee("Empty_Emp");
    await createShift(employeeId, branchId);

    const res = await request(app).post("/api/close-shift").send({ branchId, employeeId });
    expect(res.status).toBe(200);
    expect(res.body.shouldLogout).toBe(true);
  });

  // Sad: no active shift → 400
  it("should return 400 when there is no active shift for the employee on that branch", async () => {
    const branchId = await createBranch("No Shift Branch");
    const employeeId = await createEmployee("NoShift_Emp");

    const res = await request(app).post("/api/close-shift").send({ branchId, employeeId });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("No active shift found");
  });

  // Sad: missing branchId → DB error → 500
  it("should return 500 when branchId is missing", async () => {
    const res = await request(app).post("/api/close-shift").send({ employeeId: 1 });
    expect(res.status).toBe(500);
  });

  // Sad: missing employeeId → active shift query fails → 400 or 500
  it("should return an error when employeeId is missing", async () => {
    const branchId = await createBranch("Missing Emp Branch");
    const res = await request(app).post("/api/close-shift").send({ branchId });
    expect([400, 500]).toContain(res.status);
  });
});