import { describe, it, expect, beforeAll, afterEach, beforeEach } from "@jest/globals";
import request from "supertest";
import app from "../server.ts";
import { supabase } from "../supabaseAdmin.ts";
import { clearTestData } from "./setup.ts";

describe("Management API Integration Tests", () => {
  let testBranchId: number;
  let testStaffId: string;

  beforeAll(async () => {
    await clearTestData();
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe("Branch Management", () => {
    // Happy Path: fetch branches successfully
    it("should fetch all branches", async () => {
      await supabase.from("branches").insert([
        { branch_name: "Candy Kingdom", branch_address: "Land of Ooo" },
      ]);
      const res = await request(app).get("/api/management/branches");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].branch_name).toBe("Candy Kingdom");
    });

    // Happy Path: create a new branch
    it("should create a new branch", async () => {
      const res = await request(app)
        .post("/api/management/branches")
        .send({ branch_name: "Jaro Branch", branch_address: "Jaro, Iloilo" });
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
      const branch = await supabase
        .from("branches")
        .insert([{ branch_name: "Old Name", branch_address: "Old Addr" }])
        .select()
        .single();

      const res = await request(app)
        .patch(`/api/management/branches/${branch.data.id}`)
        .send({ branch_name: "Updated Branch Name" });

      expect(res.status).toBe(200);
      expect(res.body.branch_name).toBe("Updated Branch Name");
    });

    // Sad Path: update non-existing branch
    it("should return 404 when updating non-existent branch", async () => {
      const res = await request(app)
        .patch("/api/management/branches/99999")
        .send({ branch_name: "Ghost Branch" });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Branch not found");
    });

    // Happy Path: delete a branch
    it("should remove a branch", async () => {
      const branch = await supabase
        .from("branches")
        .insert([{ branch_name: "Delete Me", branch_address: "Nowhere" }])
        .select()
        .single();

      const res = await request(app).delete(
        `/api/management/branches/${branch.data.id}`
      );

      expect(res.status).toBe(204);
      const { data } = await supabase
        .from("branches")
        .select()
        .eq("id", branch.data.id);
      expect(data?.length).toBe(0);
    });
  });

  describe("Staff Management", () => {
    beforeEach(async () => {
      const branch = await supabase
        .from("branches")
        .insert([{ branch_name: "Test Branch", branch_address: "Somewhere" }])
        .select()
        .single();

      testBranchId = branch.data.id;

      const user = await supabase
        .from("users")
        .insert([
          {
            user_name: "Finn the Human",
            user_pin: "1234", 
            user_role: "employee",
          },
        ])
        .select()
        .single();

      testStaffId = user.data.id;
    });
    
    // Happy Path: fetch only employees
    it("should fetch only staff members (employees)", async () => {
      await supabase.from("users").insert([{ 
        user_name: "Migo Owner", 
        user_pin: "9999", 
        user_role: "owner",   
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
      expect(res.body.length).toBe(0);
    });

    // Happy Path: update staff details
    it("should update staff name and role", async () => {
      const res = await request(app)
        .patch(`/api/management/users/${testStaffId}`)
        .send({
          user_name: "Marshall Lee",
          user_role: "OWNER",
        });

      expect(res.status).toBe(200);
      expect(res.body.user_name).toBe("Marshall Lee");
      expect(res.body.user_role).toBe("owner");
    });

    // Sad Path: update non-existent staff
    it("should return 404 when patching a non-existent staff member", async () => {
      const res = await request(app)
        .patch("/api/management/users/99999")
        .send({ user_name: "Ghost" });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    // Happy Path: delete a staff member
    it("should remove a staff member", async () => {
      const res = await request(app).delete(`/api/management/users/${testStaffId}`);
      expect(res.status).toBe(204);
    });
  });
});