import { TrendingUp } from 'lucide-react';

interface GrillingProduct {
  product_name: string;
  current_count: number;
}

interface GrillStatusGridProps {
  items: GrillingProduct[];
}

export function GrillStatusGrid({ items }: GrillStatusGridProps) {
  return (
    <div className="mb-4 rounded-lg bg-gray-50 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
        <TrendingUp className="h-4 w-4 text-[#FFC107]" />
        Grill Status
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg bg-white border border-gray-200 p-3 shadow-sm"
            >
              <span className="text-sm font-medium text-gray-700">{item.product_name}</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-[#FFC107]">{item.current_count}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">On Grill</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 italic py-2">No items currently grilling</p>
        )}
      </div>
    </div>
  );
}
