import { useState, useEffect } from "react";
import { Package, Plus, Edit2, Save, X, Loader2 } from "lucide-react";
import logoImage from "@/assets/logoImage.png";

interface InventoryItem {
  id: string; 
  branch_price: number;
  stock_quantity: number;
  product_id: string;
  products: {
    id: string;
    product_name: string;
    is_grilled: boolean;
  };
}

interface Branch {
  id: string;
  branch_name: string;
}

const UI_COLORS = [
  { color: "bg-[#D32F2F]", hoverColor: "hover:bg-[#B71C1C]" },
  { color: "bg-[#FFC107]", hoverColor: "hover:bg-[#FFA000]" },
  { color: "bg-[#212121]", hoverColor: "hover:bg-[#424242]" },
  { color: "bg-[#4CAF50]", hoverColor: "hover:bg-[#388E3C]" },
  { color: "bg-[#2196F3]", hoverColor: "hover:bg-[#1976D2]" },
];

const PORT = import.meta.env.VITE_PORT;
const BASE_AUTH_URL = `http://localhost:${PORT}/api/auth`;
const BASE_PRODUCT_URL = `http://localhost:${PORT}/api/products`;

export function ProductsManager() {
  const [selectedBranchId, setSelectedBranchId] = useState<string>("")
  const [branches, setBranches] = useState<Branch[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState({ price: 0, stock: 0 });
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    is_grilled: false,
    stock: 0
  });

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch(`${BASE_AUTH_URL}/branches`);
        const data = await res.json();
        setBranches(data);
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };
    fetchBranches();
  }, []);

  const fetchBranchInventory = async (branchId: string) => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_PRODUCT_URL}/branch/${branchId}`);
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error("Error loading inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchInventory(selectedBranchId);
  }, [selectedBranchId]);

  const addProduct = async () => {
    if (!selectedBranchId) return alert("Please select a branch first");
    if (!newProduct.name || newProduct.price <= 0) return alert("Invalid inputs");

    try {
      const res = await fetch(`${BASE_PRODUCT_URL}/branch-assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: newProduct.name,
          branch_price: newProduct.price,
          is_grilled: newProduct.is_grilled,
          branchId: selectedBranchId,
          initial_stock: newProduct.stock
        }),
      });

      if (res.ok) {
        await fetchBranchInventory(selectedBranchId);
        setNewProduct({ name: "", price: 0, is_grilled: false, stock: 0 });
        setIsAdding(false);
      }
    } catch (err) {
      alert("Failed to save product.");
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditForm({
      price: item.branch_price,
      stock: item.stock_quantity,
    });
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`${BASE_PRODUCT_URL}/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch_price: editForm.price,
          stock_quantity: editForm.stock,
        }),
      });

      if (res.ok) {
        await fetchBranchInventory(selectedBranchId);
        setEditingId(null);
      }
    } catch (err) {
      alert("Failed to update inventory.");
    }
  };

  const deleteProduct = async (id: string) => {
    console.log("Attempting to delete product with ID:", id);

    if (!id) {
      alert("Error: Product ID is missing.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    try {
      const res = await fetch(`${BASE_PRODUCT_URL}/inventory/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        console.log("Delete successful");
        setInventory((prev) => prev.filter((item) => item.id !== id));
      } else {
        const errorData = await res.json();
        alert(`Delete failed: ${errorData.error || "Server error"}`);
      }
    } catch (err) {
      console.error("Delete Network Error:", err);
      alert("Connection error. Check if backend is running.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img 
            src={logoImage} 
            alt="Migo's Lechon"
             className="h-16 w-16 rounded-full" 
          />
          <div>
            <h1 className="text-2xl font-bold text-[#212121]">
              Inventory & Pricing
            </h1>
            <p className="text-gray-600 font-medium">Manage branch menu items</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="p-3 border-2 border-gray-200 rounded-xl focus:border-[#D32F2F] outline-none font-bold text-sm bg-white shadow-sm"
          >
            <option value="">Select Branch</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
          </select>

          <button
            onClick={() => setIsAdding(true)}
            disabled={!selectedBranchId}
            className="flex items-center gap-2 rounded-xl bg-[#D32F2F] px-6 py-3 text-white hover:bg-[#B71C1C] disabled:opacity-50 transition-all shadow-md"
          >
            <Plus className="h-5 w-5" />
            <span className="font-bold">Add Product</span>
          </button>
        </div>
      </div>

      {/* Add New Product Form */}
      {isAdding && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-xl border-2 border-[#D32F2F] animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-black text-[#212121] mb-4 uppercase tracking-tight">Add to {branches.find(b => b.id === selectedBranchId)?.branch_name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Product Name"
              className="p-3 border-2 rounded-xl"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
            />
            <input
              type="number"
              value={newProduct.price || ""}
              onChange={(e) => 
                setNewProduct({
                  ...newProduct, 
                  price: parseFloat(e.target.value),
                })
              }
              placeholder="Price (₱)"
              className="p-3 border-2 rounded-xl"
            />
            <input
              type="number"
              placeholder="Initial Stock"
              className="p-3 border-2 rounded-xl"
              value={newProduct.stock || ""}
              onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
            />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 font-bold text-sm text-gray-600">
              <input 
                type="checkbox" 
                className="w-5 h-5 accent-[#D32F2F]"
                checked={newProduct.is_grilled}
                onChange={(e) => setNewProduct({...newProduct, is_grilled: e.target.checked})}
              />
              Requires Grilling
            </label>
          </div>
          <div className="flex gap-3">
            <button onClick={addProduct} className="bg-[#D32F2F] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#B71C1C]">Save Product</button>
            <button onClick={() => setIsAdding(false)} className="bg-gray-100 text-gray-500 px-6 py-2 rounded-xl font-bold">Cancel</button>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-md min-h-[400px]">
        {!selectedBranchId ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Package className="h-12 w-12 mb-2 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-xs">Select a branch to view inventory</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-[#D32F2F]" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {inventory.map((item, index) => {
              const colorSet = UI_COLORS[index % UI_COLORS.length];
              return (
                <div key={item.id} className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl hover:border-gray-200 bg-white shadow-sm">
                  {editingId === item.id ? (
                    <div className="flex-1 flex gap-4 items-center">
                       <input 
                         type="number" 
                         value={editForm.price} 
                         onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value)})}
                         className="border-2 border-[#D32F2F] rounded-lg p-2 w-32"
                       />
                       <input 
                         type="number" 
                         value={editForm.stock} 
                         onChange={(e) => setEditForm({...editForm, stock: parseInt(e.target.value)})}
                         className="border-2 border-[#D32F2F] rounded-lg p-2 w-32"
                       />
                       <button onClick={() => saveEdit(item.id)} className="bg-[#4CAF50] text-white p-2 rounded-lg"><Save /></button>
                       <button onClick={() => setEditingId(null)} className="bg-gray-200 text-gray-500 p-2 rounded-lg"><X /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className={`w-1 h-10 rounded-full ${colorSet.color}`} />
                        <div>
                          <p className="font-black text-[#212121] uppercase tracking-tight">{item.products.product_name}</p>
                          <div className="flex gap-4">
                            <p className="text-[#D32F2F] font-bold text-sm">₱{Number(item.branch_price).toFixed(2)}</p>
                            <p className="text-gray-400 font-bold text-sm">STOCK: {item.stock_quantity}</p>
                            {item.products.is_grilled && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-black uppercase">Grill Item</span>}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => startEdit(item)} className="p-3 bg-gray-50 text-gray-400 hover:text-[#D32F2F] rounded-xl transition-all"><Edit2 className="h-5 w-5" /></button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
