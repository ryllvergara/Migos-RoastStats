import { useState, useEffect } from "react";
import { AppConfig, executeSale, undoLastSale } from "../patterns/index";
import { POSHeader } from '@/components/pos/POSHeader';
import { GrillStatusPanel } from '@/components/pos/GrillStatusPanel';
import { MenuGrid } from '@/components/pos/MenuGrid';
import { CloseShiftDialog } from '@/components/pos/CloseShiftDialog';
import { RecentSalesList } from '@/components/pos/RecentSalesList';
import { SaleItem } from '@/components/pos/RecentSaleItem';

interface Product {
  id: string;
  product_name: string;
  product_price: number;
  is_grilled: boolean;
}

export function GrillSidePOS() {
  const [menuItems, setMenuItems] = useState<Product[]>([]);
  const [grillCount, setGrillCount] = useState<Record<string, number>>({});
  const [branchStocks, setBranchStocks] = useState<Record<string, number>>({});
  const [recentSales, setRecentSales] = useState<SaleItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const config = AppConfig.getInstance();

  const syncBranchData = async (showLoader = false) => {
    const currentBranchId = AppConfig.getInstance().branchId
    const baseUrl = AppConfig.getInstance().baseUrl
    if (!currentBranchId) return; 
    try {
      if (showLoader) setLoading(true);
      const [prodRes, syncRes] = await Promise.all([
        fetch(`${baseUrl}/products/branch/${currentBranchId}`),
        fetch(`${baseUrl}/sync/${currentBranchId }`)
      ]);

      if (!prodRes.ok || !syncRes.ok) throw new Error("Sync failed");

      const products = await prodRes.json();
      const flatProducts = products.map((inv: any) => ({
        id: inv.products.id,
        inventoryId: inv.id,
        product_name: inv.products.product_name,
        product_price: inv.branch_price,
        is_grilled: inv.products.is_grilled,
      }));
      const sync = await syncRes.json();

      setMenuItems(flatProducts);
      setTotalRevenue(sync.totalRevenue || 0);
      setRecentSales(
        sync.history.map((s: any) => ({
          id: s.id,
          productId: s.product_id,
          item: s.products?.product_name,
          price: s.sold_price,
          recordedBy: s.users?.user_name,
          timestamp: new Date(s.sold_at),
          isGrilled: s.products?.is_grilled,
        }))
      );

      const counts: Record<string, number> = {};
      sync.grillInventory.forEach((item: any) => (counts[item.product_id] = item.current_count));
      setGrillCount(counts);

      const stockLevels: Record<string, number> = {};
      sync.branchStocks.forEach(
        (item: any) => (stockLevels[item.product_id] = item.stock_quantity)
      );
      setBranchStocks(stockLevels);
    } catch (err) {
      console.error('Sync Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncBranchData(true);
    const interval = setInterval(() => syncBranchData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSale = async (item: Product) => {
    if (item.is_grilled) {
      setGrillCount((prev) => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }));
    }
    try {
      await executeSale({
        item,
        employeeId: config.employeeId!,
        branchId: config.branchId!,
        baseUrl: config.baseUrl,
      });
      syncBranchData();
    } catch (err) {
      if (item.is_grilled) {
        setGrillCount((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
      }
      console.error(err);
    }
  };

  const handleUndo = async (sale: SaleItem) => {
    setRecentSales((prev) => prev.filter((s) => s.id !== sale.id));
    try {
      await undoLastSale(sale.id);
      syncBranchData();
    } catch (err) {
      console.error(err);
      syncBranchData();
    }
  };

  const handleCloseShift = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.baseUrl}/close-shift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: config.branchId, employeeId: config.employeeId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Shift closed! Sales archived for audit.');
        if (data.shouldLogout) {
          sessionStorage.clear();
          window.location.href = '/';
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const adjustGrill = async (productId: string, delta: number) => {
    const currentStock = branchStocks[productId] || 0;
    if (grillCount[productId] === 0 && delta < 0) return;
    if (delta > 0 && currentStock <= 0) return;

    setGrillCount((prev) => ({ ...prev, [productId]: Math.max(0, (prev[productId] || 0) + delta) }));
    try {
      await fetch(`${config.baseUrl}/grill-adjust`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, branchId: config.branchId, delta }),
      });
      syncBranchData();
    } catch (err) {
      console.error(err);
    }
  };

  const grilledProducts = menuItems.filter((p) => p.is_grilled);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <POSHeader
        branchName={config.branchName}
        userName={config.userName}
        totalRevenue={totalRevenue}
        loading={loading}
        onSync={() => syncBranchData(true)}
      />

      <GrillStatusPanel
        grilledProducts={grilledProducts}
        grillCount={grillCount}
        branchStocks={branchStocks}
        onDecrement={(id) => adjustGrill(id, -1)}
        onIncrement={(id) => adjustGrill(id, 1)}
      />

      <MenuGrid
        menuItems={menuItems}
        grillCount={grillCount}
        branchStocks={branchStocks}
        onSale={handleSale}
      />

      <CloseShiftDialog branchName={config.branchName} onConfirm={handleCloseShift} />

      <RecentSalesList sales={recentSales} onUndo={handleUndo} />
    </div>
  );
}