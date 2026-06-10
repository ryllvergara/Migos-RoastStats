interface Branch {
  id: string;
  branch_name: string;
}

interface NewProduct {
  name: string;
  price: number;
  is_grilled: boolean;
  stock: number;
}

interface AddProductFormProps {
  branch: Branch | undefined;
  newProduct: NewProduct;
  onNewProductChange: (product: NewProduct) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function AddProductForm({
  branch,
  newProduct,
  onNewProductChange,
  onSave,
  onCancel,
}: AddProductFormProps) {
  return (
    <div className="mb-6 rounded-2xl bg-white p-6 shadow-xl border-2 border-[#D32F2F] animate-in fade-in slide-in-from-top-4">
      <h2 className="text-lg font-black text-[#212121] mb-4 uppercase tracking-tight">
        Add to {branch?.branch_name}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="Product Name"
          className="p-3 border-2 rounded-xl"
          value={newProduct.name}
          onChange={(e) =>
            onNewProductChange({ ...newProduct, name: e.target.value })
          }
        />
        <input
          type="number"
          value={newProduct.price || ""}
          onChange={(e) =>
            onNewProductChange({
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
          onChange={(e) =>
            onNewProductChange({
              ...newProduct,
              stock: parseInt(e.target.value),
            })
          }
        />
      </div>
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 font-bold text-sm text-gray-600">
          <input
            type="checkbox"
            className="w-5 h-5 accent-[#D32F2F]"
            checked={newProduct.is_grilled}
            onChange={(e) =>
              onNewProductChange({ ...newProduct, is_grilled: e.target.checked })
            }
          />
          Requires Grilling
        </label>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onSave}
          className="bg-[#D32F2F] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#B71C1C]"
        >
          Save Product
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-100 text-gray-500 px-6 py-2 rounded-xl font-bold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}