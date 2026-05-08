import { RecentSaleItem, SaleItem } from './RecentSaleItem';

interface RecentSalesListProps {
  sales: SaleItem[];
  onUndo: (sale: SaleItem) => void;
}

export function RecentSalesList({ sales, onUndo }: RecentSalesListProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <h2 className="mb-4 font-bold text-[#212121]">Recent Sales (Last 5)</h2>
      {sales.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-50 rounded-lg">
          <p className="text-gray-400">No transactions recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => (
            <RecentSaleItem key={sale.id} sale={sale} onUndo={onUndo} />
          ))}
        </div>
      )}
    </div>
  );
}
