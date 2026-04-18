import { describe, it, expect, beforeAll, beforeEach, jest } from "@jest/globals";
import request from "supertest";
import app from "../server.js";
import { supabase } from "../supabaseAdmin.js";
import { clearTestData } from "./setup.js";

jest.setTimeout(15000);

describe("Products API Integration Tests", () => {
  let testProductId: number;

  beforeAll(async () => {
    await clearTestData();
  });

  beforeEach(async () => {
    await supabase.from("products").delete().neq("id", "-1");

    const { data: product } = await supabase
      .from("products")
      .insert([{ product_name: "Dubai Chewy Cookie", product_price: 120 }])
      .select()
      .single();
    testProductId = product.id;
  });

  describe("Products and Pricing Inventory", () => {
    // Happy Path: fetch products successfully
    it("should fetch all products", async () => {
      const res = await request(app).get("/api/products");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].product_name).toBe("Dubai Chewy Cookie");
    });

    // Happy Path: create a new product
    it("should create a new product", async () => {
      const newProduct = { product_name: "Atsara", product_price: 100 };
      const res = await request(app).post("/api/products").send(newProduct);
      expect(res.status).toBe(201);
      expect(res.body.product_name).toBe("Atsara");
    });

    // Sad Path: missing product name
    it("should fail to create a product with missing data", async () => {
      const res = await request(app)
        .post("/api/products")
        .send({ product_price: 100 });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Missing fields");
    });

    // Happy Path: update product details
    it("should update product name and price", async () => {
      const update = { product_name: "Updated sha", product_price: 150 };
      const res = await request(app)
        .patch(`/api/products/${testProductId}`)
        .send(update);
      expect(res.status).toBe(200);
      expect(res.body.product_name).toBe("Updated sha");
      expect(res.body.product_price).toBe(150);
    });

    // Sad Path: invalid product ID
    it("should return 404 for non-existent product", async () => {
      const update = {
        product_name: "Ghost Product",
        product_price: 99999,
      };
      const res = await request(app).patch(`/api/products/9999`).send(update);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Product not found");
    });

    // Happy Path: delete a product
    it("should remove a product", async () => {
      const res = await request(app).delete(`/api/products/${testProductId}`);
      expect(res.status).toBe(204);

      const { data } = await supabase.from("products").select().eq("id", testProductId);
      expect(data?.length).toBe(0);
    });
  });
});
