import { useState, useEffect } from "react";
import { Undo2, AlertTriangle, Flame, Loader2, RefreshCw } from "lucide-react";
import logoImage from "@/assets/logoImage.png";

interface SaleItem {
  id: string;
  productId: string;
  item: string;
  quantity: number;
  price: number;
  timestamp: Date;
  recordedBy: string;
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
  { color: "bg-[#FFC107]", hover: "hover:bg-[#FFA000]" },
  { color: "bg-[#4CAF50]", hover: "hover:bg-[#388E3C]" },
  { color: "bg-[#2196F3]", hover: "hover:bg-[#1976D2]" },
];

const API_URL = "http://localhost:3000/api/products";

export function GrillSidePOS() {
  const [menuItems, setMenuItems] = useState<Product[]>([]);
  const [grillCount, setGrillCount] = useState<Record<string, number>>({});
  const [recentSales, setRecentSales] = useState<SaleItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  const employeeBranch = sessionStorage.getItem("employeeBranch");
  const branchName = employeeBranch === "branch-a" ? "Branch A" : "Branch B";
  const employeeName = sessionStorage.getItem("userName"); 


  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch menu");
      const data = await res.json();

      setMenuItems(data);

      setGrillCount((prev) => {
        const updatedCounts = { ...prev };
        data.forEach((product: Product) => {
          if (updatedCounts[product.id] === undefined) {
            updatedCounts[product.id] = 0;
          }
        });
        return updatedCounts;
      });
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
    const interval = setInterval(fetchMenuItems, 120000);
    return () => clearInterval(interval);
  }, []);

  const handleSale = (
    itemName: string,
    itemId: string,
    price: number,
    is_grilled: boolean,
  ) => {
    const newSale: SaleItem = {
      id: Date.now().toString(),
      productId: itemId,
      item: itemName,
      quantity: 1,
      price: Number(price),
      timestamp: new Date(),
      recordedBy: employeeName || "Unknown",
    };
    if (is_grilled) {
      setGrillCount((prev) => ({
        ...prev,
        [itemId]: Math.max(0, (prev[itemId] || 0) - 1),
      }));
    }

    setRecentSales([newSale, ...recentSales.slice(0, 4)]);
    setTotalRevenue((prev) => prev + Number(price));
  };

  const handleUndo = (saleId: string, itemId: string, price: number) => {
    setRecentSales(recentSales.filter((sale) => sale.id !== saleId));
    setTotalRevenue((prev) => prev - Number(price));

    const product = menuItems.find((p) => p.id === itemId);
    if (product?.is_grilled) {
      setGrillCount((prev) => ({
        ...prev,
        [itemId]: (prev[itemId] || 0) + 1,
      }));
    }
  };

  const adjustGrill = (itemId: string, delta: number) => {
    setGrillCount((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta),
    }));
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
              {branchName} • {employeeName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchMenuItems}
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
              onClick={() => handleSale(item.product_name, item.id, item.product_price, item.is_grilled)}
              className={`${design.color} ${design.hover} h-32 rounded-xl text-white shadow-md transition-all flex flex-col items-center justify-center p-2 ${isOutOfStock ? 'opacity-30 cursor-not-allowed grayscale' : 'active:scale-95'}`}
            >
              <p className="font-bold text-center leading-tight mb-1">{item.product_name}</p>
              <p className="text-sm opacity-90">{isOutOfStock ? "NONE ON GRILL" : `₱${Number(item.product_price).toFixed(2)}`}</p>
            </button>
          );
        })}
      </div>

      {/* Wastage Button */}
      <button className="mb-6 w-full rounded-xl border-2 border-dashed border-gray-300 bg-transparent py-4 text-gray-500 hover:border-[#D32F2F] hover:text-[#D32F2F] transition-all group">
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle className="h-5 w-5 group-hover:animate-pulse" />
          <span className="font-semibold">Record Wastage / Spoilage</span>
        </div>
      </button>

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
                      • {employeeName}{" "}
                      • ₱{Number(sale.price).toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUndo(sale.id, sale.productId, sale.price)}
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
