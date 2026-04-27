import { Router, Request, Response } from "express";
import { supabase } from "../supabaseAdmin";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not defined");
}

const verifyToken = (req: any, res: any, next: any) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) return res.status(401).json({ error: "Unauthorized" });
    
    if (decoded.role === "employee" && decoded.shiftId) {
      const { data: shift, error } = await supabase
        .from("shifts")
        .select("clock_out_time")
        .eq("id", decoded.shiftId)
        .single();

      if (error || !shift || shift.clock_out_time) {
        return res.status(401).json({ error: "Session revoked. Shift has been closed." });
      }
    }
    
    req.user = decoded;
    next();
  });
};

router.get('/branches', async (_req, res) => {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('branch_name', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/login", async (req: Request, res: Response) => {
  const { userName, userPin, userRole, branchId } = req.body;

  if (!userName || !userPin || !userRole) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("*")
      .eq("user_name", userName)
      .eq("user_role", userRole)
      .single();

    if (userErr || !user) return res.status(401).json({ error: "User not found" });

    const match = await bcrypt.compare(userPin, user.user_pin);
    if (!match) return res.status(401).json({ error: "Invalid PIN" });

    let activeShiftId = null;
    
    if (userRole === "employee") {
      if (!branchId) return res.status(400).json({ error: "Branch selection is required" });
      
      const { data: activeShift } = await supabase
        .from("shifts")
        .select("id, users(user_name)")
        .eq("branch_id", branchId)
        .is("clock_out_time", null)
        .maybeSingle();

      if (activeShift) {
        const occupant = (activeShift.users as any)?.user_name
        return res.status(403).json({ 
          error: `Branch is currently occupied by ${occupant}. Please wait for them to close their shift.` 
        });
      }

      const { data: newShift, error: shiftErr } = await supabase
        .from("shifts")
        .insert([{ 
            employee_id: user.id, 
            branch_id: branchId,
            clock_in_time: new Date().toISOString() 
        }])
        .select()
        .single();

      if (shiftErr) throw shiftErr;      
      activeShiftId = newShift.id;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.user_role, branchId, shiftId: activeShiftId },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.status(200).json({
      token,
      user: {
        userId: user.id,
        userName: user.user_name,
        userRole: user.user_role,
        shiftId: user.activeShiftId
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/logout", verifyToken, async (req: any, res: Response) => {
  const { shiftId } = req.user;

  try {
    if (shiftId) {
      const { error } = await supabase
        .from("shifts")
        .update({ 
          clock_out_time: new Date().toISOString()
        })
        .eq("id", shiftId);

      if (error) throw error;
    }

    res.status(200).json({ message: "Logout successful and shift recorded." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/register", async (req: Request, res: Response) => {
  const { userName, userPin, userRole } = req.body;

  if (!userName || !userPin || !userRole) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const saltRounds = 10;
    const hashedPin = await bcrypt.hash(userPin, saltRounds);

    const { data, error } = await supabase
      .from("users")
      .insert([
        { 
          user_name: userName.trim(), 
          user_role: userRole.toLowerCase(), 
          user_pin: hashedPin 
        }
      ])
      .select();

    if (error) throw error;
    res.status(201).json({ message: "User registered successfully", user: data[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;