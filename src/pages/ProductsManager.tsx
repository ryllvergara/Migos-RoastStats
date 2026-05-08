import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import logoImage from "../assets/logoImage.png";
import { AppConfig } from "../patterns/index";
import { AddProductForm } from "../components/productsManager/AddProductForm";
import { InventoryList } from "../components/productsManager/InventoryList";

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

export function ProductsManager() {
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
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
    stock: 0,
  });
  const config = AppConfig.getInstance();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch(`${config.baseUrl}/management/branches`);
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
      const res = await fetch(`${config.baseUrl}/products/branch/${branchId}`);
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
      const res = await fetch(`${config.baseUrl}/products/branch-assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: newProduct.name,
          branch_price: newProduct.price,
          is_grilled: newProduct.is_grilled,
          branchId: selectedBranchId,
          initial_stock: newProduct.stock,
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
      const res = await fetch(`${config.baseUrl}/products/inventory/${id}`, {
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

    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(
        `${config.baseUrl}/products/inventory/delete/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );

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
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name}
              </option>
            ))}
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
        <AddProductForm
          branch={branches.find((b) => b.id === selectedBranchId)}
          newProduct={newProduct}
          onNewProductChange={setNewProduct}
          onSave={addProduct}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {/* Inventory List */}
      <InventoryList
        selectedBranchId={selectedBranchId}
        loading={loading}
        inventory={inventory}
        editingId={editingId}
        editForm={editForm}
        onStartEdit={startEdit}
        onSaveEdit={saveEdit}
        onCancelEdit={() => setEditingId(null)}
        onEditFormChange={setEditForm}
        onDelete={deleteProduct}
      />
    </div>
  );
}