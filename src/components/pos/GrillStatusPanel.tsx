import { Flame } from 'lucide-react';
import { GrillItemCard } from './GrillItemCard';

interface Product {
  id: string;
  product_name: string;
  product_price: number;
  is_grilled: boolean;
}

interface GrillStatusPanelProps {
  grilledProducts: Product[];
  grillCount: Record<string, number>;
  branchStocks: Record<string, number>;
  onDecrement: (productId: string) => void;
  onIncrement: (productId: string) => void;
}

export function GrillStatusPanel({
  grilledProducts,
  grillCount,
  branchStocks,
  onDecrement,
  onIncrement,
}: GrillStatusPanelProps) {
  return (
    <div className="mb-6 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="mb-4 flex items-center gap-2">
        <Flame className="h-5 w-5 text-[#D32F2F]" />
        <h2 className="font-bold text-[#212121]">Live Grill Status</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {grilledProducts.map((product) => (
          <GrillItemCard
            key={product.id}
            productId={product.id}
            productName={product.product_name}
            onGrill={grillCount[product.id] || 0}
            stock={branchStocks[product.id] || 0}
            onDecrement={onDecrement}
            onIncrement={onIncrement}
          />
        ))}
      </div>
    </div>
  );
}
