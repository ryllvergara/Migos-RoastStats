import { describe, it, expect, beforeAll, afterEach } from "@jest/globals";
import request from "supertest";
import app from "../server.js";
import { supabase } from "../supabaseAdmin.js";
import { clearTestData } from "./setup.js";

describe("Authentication API Integration Tests", () => {
  const testUser = {
    userName: "Fritzie_Test",
    userPin: "0000",
    userRole: "owner",
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
    // Happy Path: successfull login
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
      expect(res.body.message).toBe("Login successful");
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
      expect(res.body.error).toBe("Invalid PIN code");
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
      expect(res.body.error).toBe("Invalid credentials or role");
    });

    // Sad Path: role mismatch
    it("should return 401 if role does not match", async () => {
      await request(app).post("/api/auth/register").send(testUser);
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          userName: testUser.userName,
          userPin: testUser.userPin,
          userRole: "employee" // Incorrect role
        });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials or role");
    }, 10000);
  });

  describe("GET /api/auth/branches", () => {
    // Happy Path: fetch branches successfully
    it("should fetch list of branches from DB", async () => {
      await supabase.from('branches').insert([{ branch_name: "Test Branch" }]);
      const res = await request(app).get("/api/auth/branches");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    // Sad Path: no branches in database
    it("should return empty array if no branches exist", async () => {
      const res = await request(app).get("/api/auth/branches");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    // Sad Path: handle database connectivity issues
    it("should handle database connectivity issues", async () => {
      const res = await request(app).get("/api/auth/branches");
      expect(res.status).toBe(200); 
    });
  });
});