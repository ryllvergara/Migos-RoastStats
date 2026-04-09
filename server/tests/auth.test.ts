import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import bcrypt from "bcryptjs";

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

jest.mock("../supabaseAdmin.js", () => ({
  supabase: mockSupabase,
}));

import app from "../server.js";
import { supabase } from "../supabaseAdmin.js";

describe("Authentication API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if required fields are missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ userName: "Fritzie" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  it("should return 401 if user does not exist in database", async () => {
    (mockSupabase.single as jest.Mock<any>).mockResolvedValueOnce({
      data: null,
      error: { message: "User not found" },
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ userName: "GhostUser", userPin: "1234", userRole: "owner" });

    expect(res.status).toBe(401);
  });

  it("should return 200 and user data if PIN is correct", async () => {
    const rawPin = "0518";

    const hashedPin = await bcrypt.hash(rawPin, 10);

    (mockSupabase.single as jest.Mock<any>).mockResolvedValueOnce({
      data: {
        userId: "1",
        userName: "Fritzie",
        userRole: "owner",
        userPin_hash: hashedPin,
      },
      error: null,
    });

    const res = await request(app).post("/api/auth/login").send({
      userName: "Fritzie",
      userPin: rawPin, 
      userRole: "owner",
    });

    if (res.status === 401) {
      console.log("Debug Response Body:", res.body);
    }

    expect(res.status).toBe(200);
    expect(res.body.user.userName).toBe("Fritzie");
  });
});
