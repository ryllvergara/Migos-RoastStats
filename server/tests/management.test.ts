import { describe, it, expect, beforeAll, beforeEach, jest } from "@jest/globals";
import request from "supertest";
import app from "../server.js";
import { supabase } from "../supabaseAdmin.js";
import { clearTestData } from "./setup.js";

jest.setTimeout(15000);

describe("Management API Integration Tests", () => {
  let testBranchId: number;
  let testStaffId: string;

  beforeAll(async () => {
    await clearTestData();
  });

  beforeEach(async () => {
    await supabase.from("users").delete().neq("id", "-1");
    await supabase.from("branches").delete().neq("id", "-1");

    const { data: branch } = await supabase
      .from("branches")
      .insert([{ branch_name: "Candy Kingdom", branch_address: "Land of Ooo" }])
      .select()
      .single();
    testBranchId = branch.id;

    const { data: user } = await supabase
      .from("users")
      .insert([{ 
        user_name: "Finn the Human", 
        user_pin: "1234", 
        user_role: "employee", 
        branch_id: testBranchId 
      }])
      .select()
      .single();
    testStaffId = user.id;
  });

  describe("Branch Management", () => {
    // Happy Path: fetch branches successfully
    it("should fetch all branches", async () => {
      const res = await request(app).get("/api/management/branches");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].branch_name).toBe("Candy Kingdom");
    });

    // Happy Path: create a new branch
    it("should create a new branch", async () => {
      const newBranch = { branch_name: "Jaro Branch", branch_address: "Jarp, Iloilo" };
      const res = await request(app).post("/api/management/branches").send(newBranch);  
      expect(res.status).toBe(201);
      expect(res.body.branch_name).toBe("Jaro Branch");
    });

    // Sad Path: missing branch name
    it("should fail to create a branch with missing data", async () => {
      const res = await request(app).post("/api/management/branches").send({});
      expect(res.status).toBe(500);
    });

    // Happy Path: update branch details
    it("should update branch details", async () => {
      const update = { branch_name: "Updated Branch Name" };
      const res = await request(app)
        .patch(`/api/management/branches/${testBranchId}`)
        .send(update);
      expect(res.status).toBe(200);
      expect(res.body.branch_name).toBe("Updated Branch Name");
    });

    // Sad Path: update non-existent branch
    it("should return 404 (or null) when patching a non-existent branch", async () => {
      const res = await request(app)
        .patch("/api/management/branches/99999")
        .send({ branch_name: "Ghost Branch" });
      expect(res.status).toBe(404);
    });

    // Happy Path: delete a branch
    it("should remove a branch", async () => {
      await supabase.from("users").delete().eq("branch_id", testBranchId);
      const res = await request(app).delete(`/api/management/branches/${testBranchId}`);
      expect(res.status).toBe(204);
      const { data } = await supabase.from("branches").select().eq("id", testBranchId);
      expect(data?.length).toBe(0);
    });
  });

  describe("Staff Management", () => {
    // Happy Path: fetch only employees
    it("should fetch only staff members (employees)", async () => {
      await supabase.from("users").insert([{ 
        user_name: "Migo Owner", 
        user_pin: "9999", 
        user_role: "owner", 
        branch_id: testBranchId 
      }]);
      const res = await request(app).get("/api/management/users");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].user_name).toBe("Finn the Human");
    });

    // Edge Case: no staff members    
    it("should return an empty array when no staff members exist", async () => {
      await supabase.from("users").delete().neq("id", "-1");
      const res = await request(app).get("/api/management/users");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    // Happy Path: update staff details
    it("should update staff name and role", async () => {
      const update = { user_name: "Marshall Lee", user_role: "OWNER" }; 
      const res = await request(app)
        .patch(`/api/management/users/${testStaffId}`)
        .send(update);
      
      expect(res.status).toBe(200);
      expect(res.body.user_name).toBe("Marshall Lee");
      expect(res.body.user_role).toBe("owner"); 
    });

    // Sad Path: update non-existent staff
    it("should return 404 (or null) when patching a non-existent staff member", async () => {
      const res = await request(app)
        .patch("/api/management/users/99999")
        .send({ user_name: "Ghost Staff" });
      expect(res.status).toBe(404);
    });

    // Happy Path: delete a staff member
    it("should remove a staff member", async () => {
      const res = await request(app).delete(`/api/management/users/${testStaffId}`);
      expect(res.status).toBe(204);
    });
  });
});