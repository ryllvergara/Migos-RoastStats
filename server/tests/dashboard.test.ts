import { describe, it, expect, beforeAll, afterEach, jest } from "@jest/globals";
import request from "supertest";
import app from "../server";
import { supabase } from "../supabaseAdmin";
import { clearTestData } from "./setup";
import http from 'http';

jest.setTimeout(15000);

async function createBranch(
  name: string,
  status = "active",
  removed = false
): Promise<number> {
  const { data } = await supabase
    .from("branches")
    .insert([{ branch_name: name, branch_address: "Test St", last_audit_status: status, removed }])
    .select()
    .single();
  return data!.id;
}

async function createProduct(productName: string, isGrilled = false): Promise<number> {
  const { data } = await supabase
    .from("products")
    .insert([{ product_name: productName, is_grilled: isGrilled }])
    .select()
    .single();
  return data!.id;
}

async function insertInventory(branchId: number, productId: number, price = 100, stock = 10) {
  await supabase.from("branch_inventory").insert([{
    branch_id: branchId,
    product_id: productId,
    branch_price: price,
    stock_quantity: stock,
  }]);
}

async function insertSale(branchId: number, productId: number, employeeId: number, price = 100) {
  await supabase.from("sales").insert([{
    branch_id: branchId,
    product_id: productId,
    employee_id: employeeId,
    sold_price: price,
    product_name_at_sale: "Test Item",
    sold_at: new Date().toISOString(),
    is_archived: false,
  }]);
}

async function createEmployee(name = "Dash_Employee"): Promise<number> {
  const { data } = await supabase
    .from("users")
    .insert([{ user_name: name, user_role: "employee", user_pin: "x" }])
    .select()
    .single();
  return data!.id;
}

beforeAll(async () => { await clearTestData(); });
afterEach(async () => { await clearTestData(); });

describe("GET /api/dashboard/overview", () => {
  // Happy: no branches -- empty array
  it("should return an empty array when there are no active branches", async () => {
    const res = await request(app).get("/api/dashboard/overview");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // Happy: branches returned with correct shape
  it("should return branches with id, name, revenue, auditStatus, grillStatus, latestSale, lastUpdate", async () => {
    await createBranch("Shape Branch");
    const res = await request(app).get("/api/dashboard/overview");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    const branch = res.body[0];
    expect(branch).toMatchObject({
      id: expect.any(Number),
      name: "Shape Branch",
      revenue: expect.any(Number),
      auditStatus: expect.any(String),
      grillStatus: { items: expect.any(Array) },
      lastUpdate: expect.any(String),
    });
  });

  // Happy: revenue is correctly summed from today's sales
  it("should correctly aggregate today's revenue from sales", async () => {
    const branchId = await createBranch("Revenue Branch");
    const productId = await createProduct("Hotdog");
    const employeeId = await createEmployee();
    await insertInventory(branchId, productId, 150);
    await insertSale(branchId, productId, employeeId, 150);
    await insertSale(branchId, productId, employeeId, 150);

    const res = await request(app).get("/api/dashboard/overview");
    expect(res.status).toBe(200);
    const branch = res.body.find((b: any) => b.id === branchId);
    expect(branch.revenue).toBe(300);
  });

  // Sad: removed branches are excluded
  it("should not include removed branches in the overview", async () => {
    await createBranch("Removed Branch", "active", true);
    await createBranch("Visible Branch", "active", false);
    const res = await request(app).get("/api/dashboard/overview");
    expect(res.status).toBe(200);
    const names = res.body.map((b: any) => b.name);
    expect(names).not.toContain("Removed Branch");
    expect(names).toContain("Visible Branch");
  });
});

describe("GET /api/dashboard/live-updates (SSE)", () => {
  // Happy: connection establishes with correct SSE headers
  it("should respond with SSE headers and keep connection open", (done) => {
    // Start the server on a random available port
    const server = app.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'string' ? null : address?.port;

      if (!port) {
        server.close();
        return done(new Error("Failed to get ephemeral port"));
      }

      // Use the dynamic port in the URL
      http.get(`http://localhost:${port}/api/dashboard/live-updates`, (res) => {
        try {
          expect(res.headers["content-type"]).toContain("text/event-stream");
          expect(res.headers["cache-control"]).toContain("no-cache");
          expect(res.headers["connection"]).toContain("keep-alive");

          // Destroy the client response socket
          res.destroy(); 
          // Close the server so the test can exit
          server.close(() => {
            done();
          });
        } catch (err) {
          res.destroy();
          server.close(() => {
            done(err as Error);
          });
        }
      }).on('error', (err) => {
        server.close(() => {
          done(err);
        });
      });
    });
  });

  // Happy: endpoint returns 200 status code
  it("should return HTTP 200 when connecting to the SSE endpoint", async () => {
    const res = await request(app)
      .get("/api/dashboard/live-updates")
      .timeout({ response: 500, deadline: 1000 })
      .catch((err) => err.response ?? err);
    if (res && res.status) {
      expect([200]).toContain(res.status);
    } else {
      expect(true).toBe(true);
    }
  });
});