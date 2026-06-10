import { Edit2, Save, X, Trash2 } from "lucide-react";

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

interface EditForm {
  price: number;
  stock: number;
}

interface ProductCardProps {
  item: InventoryItem;
  colorClass: string;
  isEditing: boolean;
  editForm: EditForm;
  onStartEdit: (item: InventoryItem) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onEditFormChange: (form: EditForm) => void;
  onDelete: (id: string) => void;
}

export function ProductCard({
  item,
  colorClass,
  isEditing,
  editForm,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditFormChange,
  onDelete,
}: ProductCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl hover:border-gray-200 bg-white shadow-sm">
      {isEditing ? (
        <div className="flex-1 flex gap-4 items-center">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Price</label>
            <input
              type="number"
              value={editForm.price}
              onChange={(e) =>
                onEditFormChange({ ...editForm, price: parseFloat(e.target.value) })
              }
              className="border-2 border-[#D32F2F] rounded-lg p-2 w-32 text-sm font-bold"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Stocks</label>
            <input
              type="number"
              value={editForm.stock}
              onChange={(e) =>
                onEditFormChange({ ...editForm, stock: parseInt(e.target.value) })
              }
              className="border-2 border-[#D32F2F] rounded-lg p-2 w-32 text-sm font-bold"
            />
          </div>
          <div className="flex gap-2 mt-4"> 
            <button
              onClick={() => onSaveEdit(item.id)}
              className="bg-[#4CAF50] text-white p-2 rounded-lg hover:bg-[#388E3C] transition-colors"
            >
              <Save className="h-5 w-5" />
            </button>
            <button
              onClick={onCancelEdit}
              className="bg-gray-200 text-gray-500 p-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className={`w-1 h-10 rounded-full ${colorClass}`} />
            <div>
              <p className="font-black text-[#212121] uppercase tracking-tight">
                {item.products.product_name}
              </p>
              <div className="flex gap-4">
                <p className="text-[#D32F2F] font-bold text-sm">
                  ₱{Number(item.branch_price).toFixed(2)}
                </p>
                <p className="text-gray-400 font-bold text-sm">
                  STOCK: {item.stock_quantity}
                </p>
                {item.products.is_grilled && (
                  <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-black uppercase">
                    Grill Item
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onStartEdit(item)}
              className="p-3 bg-gray-50 text-gray-400 hover:text-[#D32F2F] rounded-xl transition-all"
            >
              <Edit2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-3 bg-gray-50 text-gray-400 hover:text-red-600 rounded-xl transition-all"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}