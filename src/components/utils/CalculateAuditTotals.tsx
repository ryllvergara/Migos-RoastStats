// Calculation helper
import { AuditProduct } from "../AuditModal";

export const calculateAuditTotals = (products: AuditProduct[]) => {
  const productsWithRevenue = products.map(p => ({
    ...p,
    revenue: p.unitsSold * p.pricePerUnit
  }));
  
  const totalExpected = productsWithRevenue.reduce((acc, p) => acc + p.revenue, 0);
  
  return {
    products: productsWithRevenue,
    totalExpected
  };
};