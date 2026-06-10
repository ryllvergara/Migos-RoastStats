import { describe, it, expect, beforeAll, afterEach, jest } from "@jest/globals";
import request from "supertest";
import app from "../server";
import { supabase } from "../supabaseAdmin";
import { clearTestData } from "./setup";

jest.setTimeout(15000);

const ownerUser    = { userName: "Owner_Test",    userPin: "0000", userRole: "owner"    };
const employeeUser = { userName: "Employee_Test", userPin: "1111", userRole: "employee" };

async function registerUser(user = ownerUser) {
  return request(app).post("/api/auth/register").send(user);
}

async function getOwnerToken(): Promise<string> {
  const regRes = await registerUser(ownerUser);
  if (regRes.status !== 201) {
    throw new Error(`getOwnerToken – register failed (${regRes.status}): ${JSON.stringify(regRes.body)}`);
  }
  const loginRes = await request(app).post("/api/auth/login").send(ownerUser);
  if (loginRes.status !== 200) {
    throw new Error(`getOwnerToken – login failed (${loginRes.status}): ${JSON.stringify(loginRes.body)}`);
  }
  return loginRes.body.token as string;
}

async function createBranch(name: string, status = "audited"): Promise<number> {
  const { data, error } = await supabase
    .from("branches")
    .insert([{ branch_name: name, branch_address: "Test Address", last_audit_status: status }])
    .select()
    .single();
  if (error) throw new Error(`createBranch failed: ${error.message}`);
  return data!.id;
}

beforeAll(async () => { await clearTestData(); });
afterEach(async ()  => { await clearTestData(); });

describe("POST /api/auth/register", () => {

  // Happy: valid payload 
  it("should register a new user and return 201 with user object", async () => {
    const res = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User registered successfully");
    expect(res.body.user.user_name).toBe(ownerUser.userName);
    expect(res.body.user.user_role).toBe("owner");
  });

  // Happy: userRole is stored lowercase regardless of input casing
  it("should store user_role in lowercase", async () => {
    const res = await registerUser({ ...ownerUser, userRole: "OWNER" });
    expect(res.status).toBe(201);
    expect(res.body.user.user_role).toBe("owner");
  });

  // Sad: missing fields 
  it("should return 400 when required fields are missing", async () => {
    const res = await request(app).post("/api/auth/register").send({ userName: "NoPin" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing fields");
  });
});

describe("POST /api/auth/login", () => {
  // Happy: owner login → 200 + token + correct user shape
  it("should login owner with correct credentials and return a token", async () => {
    await registerUser(ownerUser);
    const res = await request(app).post("/api/auth/login").send(ownerUser);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.userName).toBe(ownerUser.userName);
    expect(res.body.user.userRole).toBe("owner");
    expect(res.body.user.shiftId).toBeNull();
  });

  // Happy: employee login with valid branchId → 200 + shiftId + branch becomes 'active'
  it("should login employee, create a shift, and return shiftId in token payload", async () => {
    const branchId = await createBranch("Login Branch", "audited");
    await registerUser(employeeUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ ...employeeUser, branchId });

    expect(res.status).toBe(200);
    expect(res.body.user.shiftId).toBeTruthy();

    const { data: branch } = await supabase
      .from("branches")
      .select("last_audit_status")
      .eq("id", branchId)
      .single();
    expect(branch?.last_audit_status).toBe("active");
  });

  // Sad: wrong PIN 
  it("should return 401 for incorrect PIN", async () => {
    await registerUser(ownerUser);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ ...ownerUser, userPin: "9999" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid PIN");
  });

  // Sad: non-existent user 
  it("should return 401 for a user that does not exist", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ userName: "Ghost", userPin: "0000", userRole: "owner" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("User not found");
  });

  // Sad: role mismatch 
  it("should return 401 when role does not match the registered role", async () => {
    await registerUser(ownerUser);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ ...ownerUser, userRole: "employee" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("User not found");
  }, 10000);

  // Sad: employee sends no branchId
  it("should return 400 when employee logs in without branchId", async () => {
    await registerUser(employeeUser);
    const res = await request(app).post("/api/auth/login").send(employeeUser);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Branch selection is required");
  });

  // Sad: branch occupied by another active shift 
  it("should return 403 when branch already has an active shift", async () => {
    const branchId = await createBranch("Occupied Branch", "audited");
    await registerUser(employeeUser);
    await registerUser({ ...employeeUser, userName: "Second_Employee" });

    // Look up first employee and open a shift without clock_out_time
    const { data: user1, error: u1Err } = await supabase
      .from("users")
      .select("id")
      .eq("user_name", employeeUser.userName)
      .single();
    if (u1Err || !user1) throw new Error(`Shift setup failed: ${u1Err?.message}`);

    await supabase.from("shifts").insert([{
      employee_id: user1.id,
      branch_id: branchId,
      clock_in_time: new Date().toISOString(),
    }]);

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        userName: "Second_Employee",
        userPin: employeeUser.userPin,
        userRole: "employee",
        branchId,
      });
    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Branch is currently occupied");
  });
});

describe("GET /api/auth/branches", () => {

  // Happy: only 'audited' branches with no sales today are returned
  it("should return only audited branches with no sales today", async () => {
    await supabase.from("branches").insert([
      { branch_name: "Audited Branch", last_audit_status: "audited", branch_address: "A" },
      { branch_name: "Active Branch",  last_audit_status: "active",  branch_address: "B" },
    ]);
    const res = await request(app).get("/api/auth/branches");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].branch_name).toBe("Audited Branch");
  });

  // Sad: no audited branches 
  it("should return empty array when no audited branches exist", async () => {
    await supabase.from("branches").insert([
      { branch_name: "Only Active", last_audit_status: "active", branch_address: "C" },
    ]);
    const res = await request(app).get("/api/auth/branches");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

describe("POST /api/auth/logout", () => {

  // Happy: owner logout (no shift)
  it("should logout owner successfully without recording a shift", async () => {
    const token = await getOwnerToken();
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logout successful and shift recorded.");
  });

  // Happy: employee logout -- shift gets clock_out_time stamped
  it("should logout employee and stamp clock_out_time on their shift", async () => {
    const branchId = await createBranch("Logout Branch", "audited");
    await registerUser(employeeUser);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ ...employeeUser, branchId });

    // Guard: make login failure immediately obvious
    expect(loginRes.status).toBe(200);

    const { token, user } = loginRes.body;
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const { data: shift } = await supabase
      .from("shifts")
      .select("clock_out_time")
      .eq("id", user.shiftId)
      .single();
    expect(shift?.clock_out_time).not.toBeNull();
  });

  // Sad: no Authorization header 
  it("should return 403 when no Authorization header is provided", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("No token provided");
  });

  // Sad: malformed token 
  it("should return 401 for a malformed or invalid token", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", "Bearer totally.invalid.token");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });
});