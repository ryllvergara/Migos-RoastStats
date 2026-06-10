import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import posRoutes from "./routes/posRoutes";
import managementRoutes from "./routes/managementRoutes";
import dashboardRoutes from "./routes/dashboardRoutes"
import auditRoutes from "./routes/auditRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api", posRoutes);
app.use("/api/management", managementRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/analytics", analyticsRoutes);

export default app;