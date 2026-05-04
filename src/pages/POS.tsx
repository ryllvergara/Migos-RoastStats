import { useState, useEffect } from "react";
import { AppConfig } from "../patterns/index";
import { Undo2, Flame, Loader2, RefreshCw, SaveAll } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import logoImage from "@/assets/logoImage.png";

interface SaleItem {
  id: string;
  productId: string;
  item: string;
  quantity: number;
  price: number;
  timestamp: Date;
  recordedBy: string;
  isGrilled: boolean;
}

interface Product {
  id: string;
  product_name: string;
  product_price: number;
  is_grilled: boolean;
}

const UI_COLORS = [
  { color: "bg-[#D32F2F]", hover: "hover:bg-[#B71C1C]" },
  { color: "bg-[#212121]", hover: "hover:bg-[#424242]" },
];

export function GrillSidePOS() {
  const [menuItems, setMenuItems] = useState<Product[]>([]);
  const [grillCount, setGrillCount] = useState<Record<string, number>>({});
  const [recentSales, setRecentSales] = useState<SaleItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const config = AppConfig.getInstance();

  const syncBranchData = async (showLoader = false) => {
    if (!config.branchId) return; 
    try {
      if (showLoader) setLoading(true);
      const [prodRes, syncRes] = await Promise.all([
        fetch(`${config.baseUrl}/products/branch/${config.branchId}`),
        fetch(`${config.baseUrl}/sync/${config.branchId}`)
      ]);

      if (!prodRes.ok || !syncRes.ok) throw new Error("Sync failed");

      const products = await prodRes.json();
      const flatProducts = products.map((inv: any) => ({
        id: inv.products.id,           
        inventoryId: inv.id,           
        product_name: inv.products.product_name,
        product_price: inv.branch_price,
        is_grilled: inv.products.is_grilled
      }));
      const sync = await syncRes.json();

      setMenuItems(flatProducts);
      setTotalRevenue(sync.totalRevenue || 0);
      setRecentSales(sync.history.map((s: any) => ({
        id: s.id,
        productId: s.product_id,
        item: s.products?.product_name,
        price: s.sold_price,
        recordedBy: s.users?.user_name,
        timestamp: new Date(s.sold_at),
        isGrilled: s.products?.is_grilled
      })));

      // Map grill inventory 
      const counts: Record<string, number> = {};
      sync.grillInventory.forEach((item: any) => counts[item.product_id] = item.current_count);
      setGrillCount(counts);
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync on load + every 5 seconds
  useEffect(() => {
    syncBranchData(true);
    const interval = setInterval(() => syncBranchData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSale = async (item: any) => {
    if (item.is_grilled) {
      setGrillCount(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }));
    }

    try {
      await fetch(`${config.baseUrl}/sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.id,
          employeeId: config.employeeId,
          productName: item.product_name,
          branchId: config.branchId,
          isGrilled: item.is_grilled
        }),
      });
      syncBranchData();
    } catch (err) { console.error(err); }
  };

  const handleUndo = async (sale: any) => {
    setRecentSales(prev => prev.filter(s => s.id !== sale.id));
    try {
      await fetch(`${config.baseUrl}/undo/${sale.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: sale.productId, branchId: config.branchId, isGrilled: sale.isGrilled })
      });
      syncBranchData();
    } catch (err) { console.error(err); syncBranchData(); }
  };

  const handleCloseShift = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.baseUrl}/close-shift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId: config.branchId, employeeId: config.employeeId }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Shift closed! Sales archived for audit.");
        
        if (data.shouldLogout) {
          sessionStorage.clear(); 
          window.location.href = "/";
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const adjustGrill = async (productId: string, delta: number) => {
    setGrillCount(prev => ({ ...prev, [productId]: Math.max(0, (prev[productId] || 0) + delta) }));
    
    try {
      await fetch(`${config.baseUrl}/grill-adjust`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, branchId: config.branchId, delta }),
      });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={logoImage}
            alt="Migo's Lechon"
            className="h-16 w-16 rounded-full"
          />
          <div>
            <h1 className="text-xl font-bold text-[#212121]">Grill Side POS</h1>
            <p className="text-sm text-gray-600">
              {config.branchName} • {config.userName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => syncBranchData(true)}
            className="p-2 text-gray-400 hover:text-[#D32F2F] transition-colors"
            title="Sync Menu"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Total Revenue
            </p>
            <p className="text-2xl font-black text-[#D32F2F]">
              ₱{totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Live Grill Status */}
      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
        <div className="mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-[#D32F2F]" />
          <h2 className="font-bold text-[#212121]">Live Grill Status</h2>
        </div>

        {loading && menuItems.length === 0 ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems
              .filter((product: any) => product.is_grilled)
              .map((product) => (
                <div
                  key={product.id}
                  className="rounded-lg bg-gray-50 p-3 flex items-center justify-between border border-gray-200"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-600">
                      {product.product_name}
                    </p>
                    <span className="text-lg font-bold text-[#212121]">
                      {grillCount[product.id] || 0}{" "}
                      <span className="text-xs font-normal">on grill</span>
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => adjustGrill(product.id, -1)}
                      className="h-10 w-10 rounded-lg bg-white border border-gray-200 shadow-sm text-xl hover:bg-gray-100"
                    >
                      −
                    </button>
                    <button
                      onClick={() => adjustGrill(product.id, 1)}
                      className="h-10 w-10 rounded-lg bg-[#D32F2F] text-white shadow-sm text-xl hover:bg-[#B71C1C]"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Main Menu Grid */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {menuItems.map((item, index) => {
          const design = UI_COLORS[index % UI_COLORS.length];
          const isOutOfStock = item.is_grilled && (grillCount[item.id] || 0) <= 0;

          return (
            <button
              key={item.id}
              disabled={isOutOfStock}
              onClick={() => handleSale(item)}
              className={`${design.color} ${design.hover} h-32 rounded-xl text-white shadow-md transition-all flex flex-col items-center justify-center p-2 ${isOutOfStock ? 'opacity-30 cursor-not-allowed grayscale' : 'active:scale-95'}`}
            >
              <p className="font-bold text-center leading-tight mb-1">{item.product_name}</p>
              <p className="text-sm opacity-90">{isOutOfStock ? "NONE ON GRILL" : `₱${Number(item.product_price).toFixed(2)}`}</p>
            </button>
          );
        })}
      </div>

      {/* Close Shift */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="mb-6 w-full rounded-xl border-2 border-dashed border-gray-300 bg-transparent py-4 text-gray-500 hover:border-[#D32F2F] hover:text-[#D32F2F] transition-all group">
            <div className="flex items-center justify-center gap-2">
              <SaveAll className="h-5 w-5 group-hover:animate-pulse" />
              <span className="font-semibold">Close Shift & Submit for Audit</span>
            </div>
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#212121]">Finalize Daily Sales?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive all current sales from <strong>{config.branchName}</strong> and notify the owner for audit. You won't be able to undo transactions after this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCloseShift}
              className="rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
            >
              Confirm Close Shift
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recent Sales */}
      <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
        <h2 className="mb-4 font-bold text-[#212121]">Recent Sales (Last 5)</h2>
        {recentSales.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-50 rounded-lg">
            <p className="text-gray-400">No transactions recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-4 border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#4CAF50]" />
                  <div>
                    <p className="font-bold text-[#212121]">{sale.item}</p>
                    <p className="text-xs text-gray-400">
                      {sale.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      • {sale.recordedBy}{" "}
                      • ₱{Number(sale.price).toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUndo(sale)}
                  className="flex items-center gap-1 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-[#D32F2F] hover:border-red-100 transition-all shadow-sm"
                >
                  <Undo2 className="h-4 w-4" />
                  <span>Undo</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
