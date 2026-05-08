import { Undo2 } from 'lucide-react';

export interface SaleItem {
  id: string;
  productId: string;
  item: string;
  quantity: number;
  price: number;
  timestamp: Date;
  recordedBy: string;
  isGrilled: boolean;
}

interface RecentSaleItemProps {
  sale: SaleItem;
  onUndo: (sale: SaleItem) => void;
}

export function RecentSaleItem({ sale, onUndo }: RecentSaleItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-[#4CAF50]" />
        <div>
          <p className="font-bold text-[#212121]">{sale.item}</p>
          <p className="text-xs text-gray-400">
            {sale.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
            {sale.recordedBy} • ₱{Number(sale.price).toFixed(2)}
          </p>
        </div>
      </div>
      <button
        onClick={() => onUndo(sale)}
        className="flex items-center gap-1 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-[#D32F2F] hover:border-red-100 transition-all shadow-sm"
      >
        <Undo2 className="h-4 w-4" />
        <span>Undo</span>
      </button>
    </div>
  );
}
