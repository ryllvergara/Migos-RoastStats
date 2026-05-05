import { describe, it, expect, beforeAll, beforeEach } from "@jest/globals";
import request from "supertest";
import app from "../server.ts";
import { supabase } from "../supabaseAdmin.ts";
import { clearTestData } from "./setup.ts";

describe("POS API Integration Tests", () => {
  let branchId: number;
  let productId: number;
  let employeeId: number;
  let shiftId: number;

  beforeAll(async () => {
    await clearTestData();
  });

  beforeEach(async () => {
    await clearTestData();
    const branch = await supabase
      .from("branches")
      .insert([
        {
          branch_name: "POS Branch",
          branch_address: "CPU",
        },
      ])
      .select()
      .single();

    if (!branch.data) throw new Error("Branch creation failed");
    branchId = Number(branch.data.id);
    const product = await supabase
      .from("products")
      .insert([
        {
          product_name: "Chicken BBQ",
          is_grilled: false,
        },
      ])
      .select()
      .single();

    if (!product.data) throw new Error("Product creation failed");
    productId = Number(product.data.id);

    await supabase.from("branch_inventory").insert([
      {
        branch_id: branchId,
        product_id: productId,
        branch_price: 100,
        stock_quantity: 10,
      },
    ]);

    const employee = await supabase
      .from("users")
      .insert([
          {
          user_name: "POS Cashier",
          user_role: "cashier",
          user_pin: "1234",
          },
      ])
      .select()
      .single();

    if (!employee.data) {
      console.error("Employee insert failed:", employee.error);
      throw new Error("Employee insert failed (check RLS or schema");
    }

    employeeId = Number(employee.data.id);

    const shift = await supabase
      .from("shifts")
      .insert([
        {
          branch_id: branchId,
          employee_id: employeeId,
          clock_in_time: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (!shift.data) throw new Error("Shift creation failed");
    shiftId = Number(shift.data.id);
  });

  describe("GET /sync/:branchId", () => {
    // Happy Path: fetch POS dashboard summary for valid branch
    it("should return POS dashboard data", async () => {
      const res = await request(app).get(
        `/api/sync/${branchId}`
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("totalRevenue");
      expect(res.body).toHaveProperty("history");
      expect(res.body).toHaveProperty("grillInventory");
    });
  });

  describe("POST /sale", () => {
    // Happy Path: valid sale reduces inventory
    it("should create sale and deduct stock", async () => {
      const res = await request(app)
        .post("/api/sale")
        .send({
          productId,
          employeeId,
          productName: "Chicken BBQ",
          branchId,
          isGrilled: false,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");

      // verify stock decreased
      const { data } = await supabase
        .from("branch_inventory")
        .select("stock_quantity")
        .eq("branch_id", branchId)
        .eq("product_id", productId)
        .single();

      expect(data?.stock_quantity).toBe(9);
    });

    // Sad Path: stock sale should be blocked
    it("should fail when out of stock", async () => {
      await supabase
        .from("branch_inventory")
        .update({ stock_quantity: 0 })
        .eq("branch_id", branchId)
        .eq("product_id", productId);

      const res = await request(app)
        .post("/api/sale")
        .send({
          productId,
          employeeId,
          productName: "Chicken BBQ",
          branchId,
          isGrilled: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Out of stock!");
    });
  });


  describe("PATCH /grill-adjust", () => {
    // Happy Path: adjust grill and stock quantity
    it("should adjust grill + stock", async () => {
      const res = await request(app)
        .patch("/api/grill-adjust")
        .send({
          productId,
          branchId,
          delta: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("DELETE /undo/:saleId", () => {
    let saleId: number;

    beforeEach(async () => {
      const sale = await supabase
        .from("sales")
        .insert([
          {
            product_id: productId,
            employee_id: employeeId,
            branch_id: branchId,
            sold_price: 100,
            product_name_at_sale: "Chicken BBQ",
          },
        ])
        .select()
        .single();

      if (!sale.data) throw new Error("Sale setup failed");

      saleId = Number(sale.data.id);
    });

    // Happy Path: successful undo
    it("should undo sale", async () => {
      const res = await request(app)
        .delete(`/api/undo/${saleId}`)
        .send({
          productId,
          branchId,
          isGrilled: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("POST /close-shift", () => {
    // Happy Path: successful shift close
    it("should close shift successfully", async () => {
      const res = await request(app)
        .post("/api/close-shift")
        .send({
          branchId,
          employeeId,
        });

      expect(res.status).toBe(200);
      expect(res.body.shouldLogout).toBe(true);

      const { data } = await supabase
        .from("shifts")
        .select("clock_out_time")
        .eq("id", shiftId)
        .single();

      expect(data?.clock_out_time).not.toBeNull();
    });
  });
});