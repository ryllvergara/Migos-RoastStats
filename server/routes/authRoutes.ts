import { Router, Request, Response } from "express";
import { supabase } from "../supabaseAdmin";
import bcrypt from "bcryptjs";

const router = Router();

router.get('/branches', async (req, res) => {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('branch_name', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/login", async (req: Request, res: Response) => {
  const { userName, userPin, userRole } = req.body;

  if (!userName || !userPin || !userRole) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("user_name", userName)
    .eq("user_role", userRole)
    .single();

  if (error || !user) {
    return res.status(401).json({ error: "Invalid credentials or role" });
  }

  const match = await bcrypt.compare(userPin, user.user_pin);

  if (!match) {
    return res.status(401).json({ error: "Invalid PIN code" });
  }

  res.status(200).json({
    message: "Login successful",
    user: {
      userId: user.id,
      userName: user.user_name,
      userRole: user.user_role
    }
  });
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