import { describe, it, expect, beforeAll, afterEach, jest } from "@jest/globals";
import request from "supertest";
import app from "../server";
import { supabase } from "../supabaseAdmin";
import { clearTestData } from "./setup";

jest.setTimeout(15000);

async function createBranch(name = "Mgmt Branch", address = "123 St"): Promise<number> {
  const { data } = await supabase
    .from("branches")
    .insert([{ branch_name: name, branch_address: address }])
    .select()
    .single();
  return data!.id;
}

async function createEmployee(name = "Mgmt_Employee", pin = "hashed"): Promise<number> {
  const { data } = await supabase
    .from("users")
    .insert([{ user_name: name, user_role: "employee", user_pin: pin }])
    .select()
    .single();
  return data!.id;
}

beforeAll(async () => { await clearTestData(); });
afterEach(async () => { await clearTestData(); });

describe("GET /api/management/branches", () => {
  // Happy: returns all non-removed branches ordered by name
  it("should return all non-removed branches ordered alphabetically", async () => {
    await createBranch("Zeta Branch");
    await createBranch("Alpha Branch");
    const res = await request(app).get("/api/management/branches");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    const names: string[] = res.body.map((b: any) => b.branch_name);
    expect(names.indexOf("Alpha Branch")).toBeLessThan(names.indexOf("Zeta Branch"));
  });

  // Happy: removed branches are excluded
  it("should exclude branches marked as removed", async () => {
    await createBranch("Active Branch");
    const removedId = await createBranch("Removed Branch");
    await supabase.from("branches").update({ removed: true }).eq("id", removedId);

    const res = await request(app).get("/api/management/branches");
    expect(res.status).toBe(200);
    const names: string[] = res.body.map((b: any) => b.branch_name);
    expect(names).not.toContain("Removed Branch");
    expect(names).toContain("Active Branch");
  });

  // Sad: empty database -- empty array
  it("should return an empty array when no branches exist", async () => {
    const res = await request(app).get("/api/management/branches");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("POST /api/management/branches", () => {
  // Happy: valid payload 
  it("should create a branch and return 201 with branch data", async () => {
    const res = await request(app)
      .post("/api/management/branches")
      .send({ branch_name: "New Branch", branch_address: "456 Ave" });
    expect(res.status).toBe(201);
    expect(res.body.branch_name).toBe("New Branch");
    expect(res.body.branch_address).toBe("456 Ave");
    expect(res.body).toHaveProperty("id");
  });

  // Happy: branch is immediately queryable after creation
  it("should persist the new branch so it appears in GET /branches", async () => {
    await request(app)
      .post("/api/management/branches")
      .send({ branch_name: "Persisted Branch", branch_address: "789 Blvd" });
    const list = await request(app).get("/api/management/branches");
    const names = list.body.map((b: any) => b.branch_name);
    expect(names).toContain("Persisted Branch");
  });

  // Sad: missing branch_name -- (DB not-null constraint)
  it("should return 500 when branch_name is missing", async () => {
    const res = await request(app)
      .post("/api/management/branches")
      .send({ branch_address: "No Name" });
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/management/branches/:id", () => {
  // Happy: update name and address 
  it("should update branch_name and branch_address and return the updated record", async () => {
    const id = await createBranch("Old Name");
    const res = await request(app)
      .patch(`/api/management/branches/${id}`)
      .send({ branch_name: "New Name", branch_address: "New Address" });
    expect(res.status).toBe(200);
    expect(res.body.branch_name).toBe("New Name");
    expect(res.body.branch_address).toBe("New Address");
  });

  // Happy: partial update (only name) succeeds
  it("should update only the provided fields", async () => {
    const id = await createBranch("Partial Branch", "Original Address");
    const res = await request(app)
      .patch(`/api/management/branches/${id}`)
      .send({ branch_name: "Renamed Branch" });
    expect(res.status).toBe(200);
    expect(res.body.branch_name).toBe("Renamed Branch");
  });

  // Sad: non-existent id
  it("should return 404 when the branch does not exist", async () => {
    const res = await request(app)
      .patch("/api/management/branches/99999999")
      .send({ branch_name: "Ghost" });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Branch not found");
  });

  // Sad: invalid id type 
  it("should return an error for a non-numeric id", async () => {
    const res = await request(app)
      .patch("/api/management/branches/not-a-number")
      .send({ branch_name: "X" });
    expect([400, 404, 500]).toContain(res.status);
  });
});

describe("PATCH /api/management/branches/delete/:id", () => {
  // Happy: soft-delete sets removed = true
  it("should soft-delete a branch and return { success: true }", async () => {
    const id = await createBranch("Doomed Branch");
    const res = await request(app).patch(`/api/management/branches/delete/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify removed flag
    const { data } = await supabase.from("branches").select("removed").eq("id", id).single();
    expect(data?.removed).toBe(true);
  });

  // Happy: soft-deleted branch no longer appears in GET list
  it("should exclude soft-deleted branch from subsequent GET /branches", async () => {
    const id = await createBranch("Gone Branch");
    await request(app).patch(`/api/management/branches/delete/${id}`);
    const list = await request(app).get("/api/management/branches");
    const names = list.body.map((b: any) => b.branch_name);
    expect(names).not.toContain("Gone Branch");
  });

  // Sad: non-existent id
  it("should return 404 when attempting to delete a non-existent branch", async () => {
    const res = await request(app).patch("/api/management/branches/delete/99999999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Branch not found");
  });
});

describe("GET /api/management/users", () => {
  // Happy: returns only employees (not owners) ordered by name
  it("should return only employee-role users ordered alphabetically", async () => {
    await createEmployee("Zara_Emp");
    await createEmployee("Aaron_Emp");
    await supabase.from("users").insert([{ user_name: "Boss", user_role: "owner", user_pin: "x" }]);

    const res = await request(app).get("/api/management/users");
    expect(res.status).toBe(200);
    const roles: string[] = res.body.map((u: any) => u.user_role);
    expect(roles.every(r => r === "employee")).toBe(true);
    const names: string[] = res.body.map((u: any) => u.user_name);
    expect(names.indexOf("Aaron_Emp")).toBeLessThan(names.indexOf("Zara_Emp"));
  });

  // Happy: response shape contains id, user_name, user_role (no pin)
  it("should not expose user_pin in the response", async () => {
    await createEmployee("NoPin_Emp");
    const res = await request(app).get("/api/management/users");
    expect(res.status).toBe(200);
    res.body.forEach((u: any) => expect(u).not.toHaveProperty("user_pin"));
  });

  // Sad: no employees in DB → empty array
  it("should return empty array when no employees exist", async () => {
    const res = await request(app).get("/api/management/users");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("PATCH /api/management/users/:id", () => {
  // Happy: update user_name
  it("should update user_name and return the updated user", async () => {
    const id = await createEmployee("Old_Name_Emp");
    const res = await request(app)
      .patch(`/api/management/users/${id}`)
      .send({ user_name: "New_Name_Emp", user_role: "employee" });
    expect(res.status).toBe(200);
    expect(res.body.user_name).toBe("New_Name_Emp");
  });

  // Happy: update with a new PIN -- pin is hashed, not returned in plain
  it("should hash the new user_pin when provided", async () => {
    const id = await createEmployee("Pin_Emp");
    const res = await request(app)
      .patch(`/api/management/users/${id}`)
      .send({ user_name: "Pin_Emp", user_role: "employee", user_pin: "newpin" });
    expect(res.status).toBe(200);
    // The stored pin should be bcrypt-hashed
    const { data } = await supabase.from("users").select("user_pin").eq("id", id).single();
    expect(data?.user_pin).toMatch(/^\$2[aby]\$/);
  });

  // Sad: non-existent user id
  it("should return 404 for a non-existent user id", async () => {
    const res = await request(app)
      .patch("/api/management/users/99999999")
      .send({ user_name: "Ghost", user_role: "employee" });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  // Sad: empty user_pin string → pin not updated (no error)
  it("should not update user_pin when an empty string is provided", async () => {
    const id = await createEmployee("NoPinChange_Emp");
    const { data: before } = await supabase.from("users").select("user_pin").eq("id", id).single();
    await request(app)
      .patch(`/api/management/users/${id}`)
      .send({ user_name: "NoPinChange_Emp", user_role: "employee", user_pin: "   " });
    const { data: after } = await supabase.from("users").select("user_pin").eq("id", id).single();
    // Pin must remain unchanged when only whitespace is passed
    expect(after?.user_pin).toBe(before?.user_pin);
  });
});

describe("PATCH /api/management/users/delete/:id (soft delete)", () => {
  // Happy: sets removed = true → { success: true }
  it("should soft-delete a user and return { success: true }", async () => {
    const id = await createEmployee("SoftDelete_Emp");
    const res = await request(app).patch(`/api/management/users/delete/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = await supabase.from("users").select("removed").eq("id", id).single();
    expect(data?.removed).toBe(true);
  });

  // Happy: soft-deleted employee excluded from GET /users
  it("should exclude soft-deleted employee from GET /api/management/users", async () => {
    const id = await createEmployee("Gone_Emp");
    await request(app).patch(`/api/management/users/delete/${id}`);
    const list = await request(app).get("/api/management/users");
    const ids: number[] = list.body.map((u: any) => u.id);
    expect(ids).not.toContain(id);
  });

  // Sad: non-existent user → 404
  it("should return 404 when soft-deleting a non-existent user", async () => {
    const res = await request(app).patch("/api/management/users/delete/99999999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });
});