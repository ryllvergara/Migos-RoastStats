import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductCard } from '../../components/productsManager/ProductCard';
import { fn } from '@storybook/test';

const meta: Meta<typeof ProductCard> = {
  title: 'ProductsManager/ProductCard',
  component: ProductCard,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
  args: {
    onStartEdit: fn(),
    onSaveEdit: fn(),
    onCancelEdit: fn(),
    onEditFormChange: fn(),
    onDelete: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ProductCard>;

const mockItem = {
  id: '1',
  branch_price: 270,
  stock_quantity: 45,
  product_id: '1',
  products: {
    id: '1',
    product_name: 'Lechon Manok',
    is_grilled: true,
  },
};

export const Default: Story = {
  args: {
    item: mockItem,
    colorClass: 'bg-[#D32F2F]',
    isEditing: false,
    editForm: { price: 270, stock: 45 },
  },
};

export const EditingState: Story = {
  args: {
    item: mockItem,
    colorClass: 'bg-[#D32F2F]',
    isEditing: true,
    editForm: {
      price: 270,
      stock: 50,
    },
  },
};

export const SideItem: Story = {
  args: {
    item: {
      ...mockItem,
      id: '2',
      branch_price: 100,
      stock_quantity: 45,
      product_id: '2',
      products: {
        ...mockItem.products,
        id: '2',
        product_name: 'Atchara',
        is_grilled: false,
      },
    },
    colorClass: 'bg-[#4CAF50]',
    isEditing: false,
    editForm: { price: 100, stock: 45 },
  },
};