import { describe, it, expect, beforeAll, afterEach, jest } from "@jest/globals";
import request from "supertest";
import app from "../server.ts";
import { supabase } from "../supabaseAdmin.ts";
import { clearTestData } from "./setup.ts";

jest.setTimeout(15000);

describe("Authentication API Integration Tests", () => {
  const testUser = {
    userName: "Fritzie_Test",
    userPin: "0000",
    userRole: "owner",
  };

  const testEmployee = {
    userName: "Employee_Test",
    userPin: "1111",
    userRole: "employee",
  };

  beforeAll(async () => {
    await clearTestData();
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe("POST /api/auth/register", () => {
    // Happy Path: new user registered successfully
    it("should successfully register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.message).toBe("User registered successfully");
      expect(res.body.user.user_name).toBe(testUser.userName);
    });

    // Sad Path: missing fields 
    it("should return 400 for missing fields", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ userName: "IncompleteUser" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Missing fields");
    });
  });

  describe("POST /api/auth/login", () => {
    // Happy Path: successful login
    it("should login successfully with correct credentials", async () => {
      // Register the user first to ensure they exist in the database
      await request(app).post("/api/auth/register").send(testUser);
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          userName: testUser.userName,
          userPin: testUser.userPin,
          userRole: testUser.userRole
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.userName).toBe(testUser.userName);
    });

    // Sad Path: incorrect pin 
    it("should return 401 for incorrect PIN", async () => {
      await request(app).post("/api/auth/register").send(testUser);
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          userName: testUser.userName,
          userPin: "wrong-pin",
          userRole: testUser.userRole
        });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid PIN");
    });

    // Sad Path: non-existent user 
    it("should return 401 for non-existent user", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          userName: "GhostUser",
          userPin: "1234",
          userRole: "owner"
        });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("User not found");
    });

    // Sad Path: employee login without branch_id 
    it("should return 400 if employee logs in without branchId", async () => {
      await request(app).post("/api/auth/register").send(testEmployee);
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          userName: testEmployee.userName,
          userPin: testEmployee.userPin,
          userRole: testEmployee.userRole
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Branch selection is required");
    });

    it("should block login if branch is occupied by another active shift", async () => {
      // Register two employees and a branch
      const branch = await supabase.from('branches').insert([{ branch_name: "Occupied Branch", branch_address: "CPU" }]).select().single();
      const branchId = branch.data.id;
      
      await request(app).post("/api/auth/register").send(testEmployee);
      await request(app).post("/api/auth/register").send({ ...testEmployee, userName: "Second_User" });

      // Create an active shift manually for the first user
      const { data: user1 } = await supabase.from('users').select('id').eq('user_name', testEmployee.userName).single();
      await supabase.from('shifts').insert([{ employee_id: user1?.id, branch_id: branchId }]);

      // Try to login with the second user to the same branch
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          userName: "Second_User",
          userPin: testEmployee.userPin,
          userRole: testEmployee.userRole,
          branchId: branchId
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("Branch is currently occupied");
    });

    // Sad Path: role mismatch
    it("should return 401 if role does not match", async () => {
      await request(app).post("/api/auth/register").send(testUser);
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          userName: testUser.userName,
          userPin: testUser.userPin,
          userRole: "employee"
        });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("User not found");
    }, 10000);
  });

  describe("GET /api/auth/branches", () => {
    // Happy Path: fetch branches successfully
    it("should only fetch branches that are 'audited' and not yet reported today", async () => {
      // Setup: Create one audited branch and one active branch
      await supabase.from('branches').insert([
        { branch_name: "Audited Branch", last_audit_status: "audited", branch_address: "Address A" },
        { branch_name: "Active Branch", last_audit_status: "active", branch_address: "Address B" }
      ]);
      const res = await request(app).get("/api/auth/branches");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].branch_name).toBe("Audited Branch");
    });

    // Sad Path: no branches in database
    it("should return empty array if no audited branches exist", async () => {
      await supabase.from('branches').insert([{ branch_name: "Working Branch", last_audit_status: "active", branch_address: "Address C" }]);
      const res = await request(app).get("/api/auth/branches");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });    
  });
  describe("POST /api/auth/logout", () => {
    // Happy Path: successful owner logout
    it("should logout successfully for owner (no shift)", async () => {
      // Register + login
      await request(app).post("/api/auth/register").send(testUser);

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send(testUser);

      const token = loginRes.body.token;

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Logout successful and shift recorded.");
    });

    // Happy Path: successful staff logout
    it("should logout employee and close their shift", async () => {
      // Create branch
      const branch = await supabase
        .from("branches")
        .insert([{ branch_name: "Test Branch", branch_address: "CPU" }])
        .select()
        .single();

      const branchId = branch.data.id;

      // Register employee
      await request(app).post("/api/auth/register").send(testEmployee);

      // Login (creates shift)
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          ...testEmployee,
          branchId,
        });

      const token = loginRes.body.token;
      const shiftId = loginRes.body.user.shiftId;
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);

      // Verify shift is closed
      const { data: shift } = await supabase
        .from("shifts")
        .select("clock_out_time")
        .eq("id", shiftId)
        .single();

      expect(shift?.clock_out_time).not.toBeNull();
    });

    // Sad Path: no token provided
    it("should return 403 if no token is provided", async () => {
      const res = await request(app).post("/api/auth/logout");

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("No token provided");
    });

    // Sad Path: Invalid Token
    it("should return 401 for invalid token", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", "Bearer invalid.token.here");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Unauthorized");
    });
  });
});