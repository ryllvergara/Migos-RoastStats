interface MenuItemButtonProps {
  productName: string;
  productPrice: number;
  isGrilled: boolean;
  onGrill: number;
  stock: number;
  colorClass: string;
  hoverClass: string;
  onClick: () => void;
}

export function MenuItemButton({
  productName,
  productPrice,
  isGrilled,
  onGrill,
  stock,
  colorClass,
  hoverClass,
  onClick,
}: MenuItemButtonProps) {
  const cannotSell = isGrilled ? onGrill <= 0 : stock <= 0;
  const outOfStock = stock <= 0;

  let statusLabel = `₱${Number(productPrice).toFixed(2)}`;
  if (isGrilled) {
    if (onGrill > 0) {
      statusLabel = `₱${Number(productPrice).toFixed(2)}`;
    } else {
      statusLabel = outOfStock ? 'OUT OF STOCK' : 'NONE ON GRILL';
    }
  } else if (outOfStock) {
    statusLabel = 'OUT OF STOCK';
  }

  return (
    <button
      disabled={cannotSell}
      onClick={onClick}
      className={`${colorClass} ${hoverClass} h-32 rounded-xl text-white shadow-md transition-all flex flex-col items-center justify-center p-2 ${
        cannotSell ? 'opacity-30 cursor-not-allowed grayscale' : 'active:scale-95'
      }`}
    >
      <p className="font-bold text-center leading-tight mb-1">{productName}</p>
      <p className="text-sm opacity-90">{statusLabel}</p>
    </button>
  );
}
