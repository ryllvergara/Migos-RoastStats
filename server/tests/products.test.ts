import { describe, it, expect, beforeAll, afterEach, jest } from "@jest/globals";
import request from "supertest";
import app from "../server";
import { supabase } from "../supabaseAdmin";
import { clearTestData } from "./setup";

jest.setTimeout(15000);

async function createBranch(name = "Product Branch"): Promise<number> {
  const { data } = await supabase
    .from("branches")
    .insert([{ branch_name: name, branch_address: "Product St" }])
    .select()
    .single();
  return data!.id;
}

async function createProduct(name = "Test Item", isGrilled = false): Promise<number> {
  const { data } = await supabase
    .from("products")
    .insert([{ product_name: name, is_grilled: isGrilled }])
    .select()
    .single();
  return data!.id;
}

async function assignProduct(
  branchId: number,
  productId: number,
  price = 80,
  stock = 20
): Promise<number> {
  const { data } = await supabase
    .from("branch_inventory")
    .insert([{ branch_id: branchId, product_id: productId, branch_price: price, stock_quantity: stock }])
    .select()
    .single();
  return data!.id;
}

beforeAll(async () => { await clearTestData(); });
afterEach(async () => { await clearTestData(); });

describe("GET /api/products/branch/:branchId", () => {
  // Happy: returns inventory with nested product info
  it("should return branch inventory with product details", async () => {
    const branchId = await createBranch();
    const productId = await createProduct("Chicken");
    await assignProduct(branchId, productId, 120, 15);

    const res = await request(app).get(`/api/products/branch/${branchId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const item = res.body[0];
    expect(item).toMatchObject({
      id: expect.any(Number),
      branch_price: 120,
      stock_quantity: 15,
      products: expect.objectContaining({ product_name: "Chicken" }),
    });
  });

  // Happy: soft-deleted inventory items are excluded
  it("should exclude soft-deleted inventory items", async () => {
    const branchId = await createBranch("Exclude Branch");
    const productId = await createProduct("Deleted Item");
    const invId = await assignProduct(branchId, productId);
    await supabase.from("branch_inventory").update({ is_deleted: true }).eq("id", invId);

    const res = await request(app).get(`/api/products/branch/${branchId}`);
    expect(res.status).toBe(200);
    const names = res.body.map((i: any) => i.products?.product_name);
    expect(names).not.toContain("Deleted Item");
  });

  // Sad: non-existent branch → empty array
  it("should return empty array for a non-existent branchId", async () => {
    const res = await request(app).get("/api/products/branch/99999999");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // Sad: non-numeric branchId → error from DB
  it("should return an error for a non-numeric branchId", async () => {
    const res = await request(app).get("/api/products/branch/abc");
    expect([400, 500]).toContain(res.status);
  });
});

describe("POST /api/products/branch-assign", () => {
  // Happy: new product + inventory created 
  it("should create a new product and assign it to a branch when product does not exist", async () => {
    const branchId = await createBranch("Assign Branch");
    const res = await request(app).post("/api/products/branch-assign").send({
      product_name: "Brand New Item",
      branch_price: 95,
      is_grilled: false,
      branchId,
      initial_stock: 10,
    });
    expect(res.status).toBe(201);
    expect(res.body.product.product_name).toBe("Brand New Item");
    expect(res.body.inventory.branch_price).toBe(95);
    expect(res.body.inventory.stock_quantity).toBe(10);
  });

  // Happy: existing product reused (no duplicate created)
  it("should reuse an existing product (case-insensitive match) and assign it to the branch", async () => {
    const branchId = await createBranch("Reuse Branch");
    await createProduct("Reused Item"); // pre-existing product in DB

    const res = await request(app).post("/api/products/branch-assign").send({
      product_name: "reused item", // lowercase to test ilike
      branch_price: 50,
      is_grilled: false,
      branchId,
    });
    expect(res.status).toBe(201);
    expect(res.body.product.product_name.toLowerCase()).toBe("reused item");
  });

  // Happy: initial_stock defaults to 0 when not provided
  it("should default initial_stock to 0 when not provided", async () => {
    const branchId = await createBranch("Default Stock Branch");
    const res = await request(app).post("/api/products/branch-assign").send({
      product_name: "No Stock Item",
      branch_price: 70,
      is_grilled: false,
      branchId,
    });
    expect(res.status).toBe(201);
    expect(res.body.inventory.stock_quantity).toBe(0);
  });

  // Sad: missing product_name → 400
  it("should return 400 when product_name is missing", async () => {
    const branchId = await createBranch("Missing Fields Branch");
    const res = await request(app).post("/api/products/branch-assign").send({
      branch_price: 50,
      branchId,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields for branch assignment");
  });

  // Sad: missing branchId → 400
  it("should return 400 when branchId is missing", async () => {
    const res = await request(app).post("/api/products/branch-assign").send({
      product_name: "Orphan Product",
      branch_price: 50,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields for branch assignment");
  });
});

describe("PATCH /api/products/inventory/:inventoryId", () => {
  // Happy: update price and quantity → 200 + updated record
  it("should update branch_price and stock_quantity for a given inventory item", async () => {
    const branchId = await createBranch("Update Inv Branch");
    const productId = await createProduct("Price Item");
    const invId = await assignProduct(branchId, productId, 80, 10);

    const res = await request(app)
      .patch(`/api/products/inventory/${invId}`)
      .send({ branch_price: 110, stock_quantity: 25 });
    expect(res.status).toBe(200);
    expect(res.body.branch_price).toBe(110);
    expect(res.body.stock_quantity).toBe(25);
  });

  // Happy: only price updated
  it("should allow partial updates (only branch_price)", async () => {
    const branchId = await createBranch("Partial Inv Branch");
    const productId = await createProduct("Partial Item");
    const invId = await assignProduct(branchId, productId, 60, 5);

    const res = await request(app)
      .patch(`/api/products/inventory/${invId}`)
      .send({ branch_price: 75 });
    expect(res.status).toBe(200);
    expect(res.body.branch_price).toBe(75);
  });

  // Sad: non-existent inventoryId → 404
  it("should return 404 when the inventory item does not exist", async () => {
    const res = await request(app)
      .patch("/api/products/inventory/99999999")
      .send({ branch_price: 50 });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Product not found");
  });

  // Sad: non-numeric inventoryId → error
  it("should return an error for a non-numeric inventoryId", async () => {
    const res = await request(app)
      .patch("/api/products/inventory/abc")
      .send({ branch_price: 50 });
    expect([400, 500]).toContain(res.status);
  });
});

describe("PATCH /api/products/update-stock", () => {
  // Happy: stock decremented via RPC → 200 { success: true }
  it("should decrement stock via RPC and return { success: true }", async () => {
    const branchId = await createBranch("Stock Branch");
    const productId = await createProduct("Stock Item");
    await assignProduct(branchId, productId, 100, 20);

    const res = await request(app)
      .patch("/api/products/update-stock")
      .send({ branchId, productId, quantityChange: 3 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify stock was reduced
    const { data } = await supabase
      .from("branch_inventory")
      .select("stock_quantity")
      .match({ branch_id: branchId, product_id: productId })
      .single();
    expect(data?.stock_quantity).toBe(17);
  });

  // Happy: zero change → no-op, still 200
  it("should succeed with a quantityChange of 0 (no-op)", async () => {
    const branchId = await createBranch("Zero Change Branch");
    const productId = await createProduct("Zero Item");
    await assignProduct(branchId, productId, 50, 10);

    const res = await request(app)
      .patch("/api/products/update-stock")
      .send({ branchId, productId, quantityChange: 0 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // Sad: missing productId → RPC call fails → 500
  it("should return 500 when productId is missing", async () => {
    const res = await request(app)
      .patch("/api/products/update-stock")
      .send({ branchId: 1, quantityChange: 1 });
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/products/inventory/delete/:inventoryId", () => {
  // Happy: soft-delete sets is_deleted = true → { success: true }
  it("should soft-delete an inventory item and return { success: true }", async () => {
    const branchId = await createBranch("Del Product Branch");
    const productId = await createProduct("Deleted Product");
    const invId = await assignProduct(branchId, productId);

    const res = await request(app).patch(`/api/products/inventory/delete/${invId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = await supabase
      .from("branch_inventory")
      .select("is_deleted")
      .eq("id", invId)
      .single();
    expect(data?.is_deleted).toBe(true);
  });

  // Happy: item no longer appears in GET /branch/:branchId after deletion
  it("should exclude soft-deleted item from subsequent GET /branch/:branchId", async () => {
    const branchId = await createBranch("Exclude After Del Branch");
    const productId = await createProduct("Gone Product");
    const invId = await assignProduct(branchId, productId);
    await request(app).patch(`/api/products/inventory/delete/${invId}`);

    const list = await request(app).get(`/api/products/branch/${branchId}`);
    const ids = list.body.map((i: any) => i.id);
    expect(ids).not.toContain(invId);
  });

  // Sad: non-existent inventoryId → 404
  it("should return 404 when the inventory item does not exist", async () => {
    const res = await request(app).patch("/api/products/inventory/delete/99999999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Product not found");
  });
});