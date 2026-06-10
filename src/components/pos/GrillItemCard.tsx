interface GrillItemCardProps {
  productId: string;
  productName: string;
  onGrill: number;
  stock: number;
  onDecrement: (productId: string) => void;
  onIncrement: (productId: string) => void;
}

export function GrillItemCard({
  productId,
  productName,
  onGrill,
  stock,
  onDecrement,
  onIncrement,
}: GrillItemCardProps) {
  const isOutOfStock = stock <= 0;

  return (
    <div
      className={`rounded-lg p-3 flex items-center justify-between border ${
        isOutOfStock ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div>
        <p className="text-sm font-semibold">{productName}</p>
        <div className="flex gap-2 items-center">
          <span className="text-lg font-bold">
            {onGrill} <span className="text-xs font-normal">on grill</span>
          </span>
          {stock <= 10 && stock > 0 && (
            <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 rounded-full">
              Low: {stock}
            </span>
          )}
          {isOutOfStock && (
            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 rounded-full">
              Freezer Empty
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onDecrement(productId)}
          className="h-10 w-10 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-100"
        >
          −
        </button>
        <button
          disabled={isOutOfStock}
          onClick={() => onIncrement(productId)}
          className={`h-10 w-10 rounded-lg text-white ${
            isOutOfStock ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#D32F2F] hover:bg-[#B71C1C]'
          }`}
        >
          +
        </button>
      </div>
    </div>
  );
}
