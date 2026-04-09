import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, Loader2 } from "lucide-react";
import logoImage from "@/assets/logoImage.png";

interface Product {
  id: string;
  product_name: string;
  product_price: number;
  is_grilled: boolean;
}

const UI_COLORS = [
  { color: "bg-[#D32F2F]", hoverColor: "hover:bg-[#B71C1C]" },
  { color: "bg-[#FFC107]", hoverColor: "hover:bg-[#FFA000]" },
  { color: "bg-[#212121]", hoverColor: "hover:bg-[#424242]" },
  { color: "bg-[#4CAF50]", hoverColor: "hover:bg-[#388E3C]" },
  { color: "bg-[#2196F3]", hoverColor: "hover:bg-[#1976D2]" },
];

const API_URL = "http://localhost:3000/api/products";

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    price: 0,
    is_grilled: false,
  });
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    is_grilled: false,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async () => {
    if (!newProduct.name || newProduct.price <= 0) {
      alert("Please enter a valid product name and price");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: newProduct.name,
          product_price: newProduct.price,
          is_grilled: newProduct.is_grilled,
        }),
      });

      if (res.ok) {
        await fetchProducts();
        setNewProduct({ name: "", price: 0, is_grilled: false });
        setIsAdding(false);
      }
    } catch (err) {
      alert("Failed to save product to database.");
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.product_name,
      price: product.product_price,
      is_grilled: product.is_grilled,
    });
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: editForm.name,
          product_price: editForm.price,
          is_grilled: editForm.is_grilled,
        }),
      });

      if (res.ok) {
        await fetchProducts();
        setEditingId(null);
      }
    } catch (err) {
      alert("Failed to update product.");
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
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        console.log("Delete successful");
        setProducts((prev) => prev.filter((p) => p.id !== id));
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={logoImage}
            alt="Migo's Lechon"
            className="h-16 w-16 rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold text-[#212121]">
              Products & Pricing
            </h1>
            <p className="text-gray-600">Manage branch menu items</p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 rounded-lg bg-[#D32F2F] px-6 py-3 text-white hover:bg-[#B71C1C] transition-colors shadow-md"
        >
          <Plus className="h-5 w-5" />
          <span className="font-semibold">Add Product</span>
        </button>
      </div>

      {/* Add New Product Form */}
      {isAdding && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md border-2 border-[#D32F2F] animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-[#212121] mb-4">
            Add New Product
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                placeholder="e.g., Spicy Whole Manok"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#D32F2F] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Price (₱)
              </label>
              <input
                type="number"
                value={newProduct.price || ""}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    price: parseFloat(e.target.value),
                  })
                }
                placeholder="0.00"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#D32F2F] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="is_grilled_new"
              checked={newProduct.is_grilled}
              onChange={(e) =>
                setNewProduct({ ...newProduct, is_grilled: e.target.checked })
              }
              className="w-4 h-4 accent-[#D32F2F]"
            />
            <label
              htmlFor="is_grilled_new"
              className="text-sm font-medium text-gray-700"
            >
              Requires Grilling
            </label>
          </div>
          <div className="flex gap-3">
            <button
              onClick={addProduct}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#D32F2F] text-white hover:bg-[#B71C1C]"
            >
              <Save className="h-4 w-4" />
              <span>Save Product</span>
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewProduct({ name: "", price: 0, is_grilled: false });
              }}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="rounded-lg bg-white p-6 shadow-md min-h-[400px]">
        <h2 className="text-lg font-bold text-[#212121] mb-4">
          Current Menu Items
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p>Loading products from Supabase...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product, index) => {
              const colorSet = UI_COLORS[index % UI_COLORS.length];
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white"
                >
                  {editingId === product.id ? (
                    <>
                      <div className="flex items-center gap-2 mt-2 col-span-full">
                        <input
                          type="checkbox"
                          checked={editForm.is_grilled}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              is_grilled: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-[#D32F2F]"
                        />
                        <span className="text-xs text-gray-500">
                          Grilled Item
                        </span>
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 mr-4">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          className="px-4 py-2 border-2 border-[#D32F2F] rounded-lg focus:outline-none"
                        />
                        <input
                          type="number"
                          value={editForm.price}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              price: parseFloat(e.target.value),
                            })
                          }
                          className="px-4 py-2 border-2 border-[#D32F2F] rounded-lg focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(product.id)}
                          className="p-2 rounded-lg bg-[#4CAF50] text-white hover:bg-[#388E3C]"
                          title="Save"
                        >
                          <Save className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                          title="Cancel"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-3 h-12 rounded-full ${colorSet.color}`}
                        />
                        <div>
                          <p className="text-lg font-bold text-[#212121]">
                            {product.product_name}
                          </p>
                          <p className="text-gray-600 font-medium">
                            ₱{Number(product.product_price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(product)}
                          className="p-2 rounded-lg bg-[#FFC107] text-white hover:bg-[#FFA000] transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 rounded-lg bg-gray-100 text-[#D32F2F] hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {products.length === 0 && !loading && (
              <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400">No products found in database.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 rounded-lg bg-[#FFC107]/10 border-l-4 border-[#FFC107] p-4">
        <p className="text-sm text-[#212121]">
          <strong>Cloud Sync Active:</strong> Changes made here will immediately
          reflect on all staff POS screens on all branches.
        </p>
      </div>
    </div>
  );
}
