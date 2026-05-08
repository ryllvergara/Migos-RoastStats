import { Package, PackageOpen, Loader2 } from "lucide-react";
import { ProductCard } from "./ProductCard";

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

const UI_COLORS = [
  { color: "bg-[#D32F2F]" },
  { color: "bg-[#FFC107]" },
  { color: "bg-[#212121]" },
  { color: "bg-[#4CAF50]" },
  { color: "bg-[#2196F3]" },
];

interface InventoryListProps {
  selectedBranchId: string;
  loading: boolean;
  inventory: InventoryItem[];
  editingId: string | null;
  editForm: EditForm;
  onStartEdit: (item: InventoryItem) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onEditFormChange: (form: EditForm) => void;
  onDelete: (id: string) => void;
}

export function InventoryList({
  selectedBranchId,
  loading,
  inventory,
  editingId,
  editForm,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditFormChange,
  onDelete,
}: InventoryListProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md min-h-[400px]">
    {!selectedBranchId ? (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Package className="h-12 w-12 mb-2 opacity-20" />
        <p className="font-bold uppercase tracking-widest text-xs">
          Select a branch to view inventory
        </p>
      </div>
    ) : loading ? (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-[#D32F2F]" />
      </div>
    ) : inventory.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <PackageOpen className="h-12 w-12 mb-2 opacity-20" />
        <p className="font-bold uppercase tracking-widest text-xs">
          Branch Inventory is Empty
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-4">
        {inventory.map((item, index) => {
          const colorSet = UI_COLORS[index % UI_COLORS.length];
          return (
            <ProductCard
              key={item.id}
              item={item}
              colorClass={colorSet.color}
              isEditing={editingId === item.id}
              editForm={editForm}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onEditFormChange={onEditFormChange}
              onDelete={onDelete}
            />
          );
        })}
      </div>
    )}
  </div>
  );
}