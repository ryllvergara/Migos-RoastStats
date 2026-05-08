import { MenuItemButton } from './MenuItemButton';

const UI_COLORS = [
  { color: 'bg-[#D32F2F]', hover: 'hover:bg-[#B71C1C]' },
  { color: 'bg-[#212121]', hover: 'hover:bg-[#424242]' },
];

interface Product {
  id: string;
  product_name: string;
  product_price: number;
  is_grilled: boolean;
}

interface MenuGridProps {
  menuItems: Product[];
  grillCount: Record<string, number>;
  branchStocks: Record<string, number>;
  onSale: (item: Product) => void;
}

export function MenuGrid({ menuItems, grillCount, branchStocks, onSale }: MenuGridProps) {
  return (
    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      {menuItems.map((item, index) => {
        const design = UI_COLORS[index % UI_COLORS.length];
        return (
          <MenuItemButton
            key={item.id}
            productName={item.product_name}
            productPrice={item.product_price}
            isGrilled={item.is_grilled}
            onGrill={grillCount[item.id] || 0}
            stock={branchStocks[item.id] || 0}
            colorClass={design.color}
            hoverClass={design.hover}
            onClick={() => onSale(item)}
          />
        );
      })}
    </div>
  );
}
