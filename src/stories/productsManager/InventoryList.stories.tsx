import type { Meta, StoryObj } from '@storybook/react-vite';
import { InventoryList } from '../../components/productsManager/InventoryList';
import { fn } from '@storybook/test';

const meta: Meta<typeof InventoryList> = {
  title: 'ProductsManager/InventoryList',
  component: InventoryList,
  parameters: {
    layout: 'padded',
  },
  args: {
    onStartEdit: fn(),
    onSaveEdit: fn(),
    onCancelEdit: fn(),
    onEditFormChange: fn(),
    onDelete: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof InventoryList>;

const mockInventory = [
  {
    id: '1',
    branch_price: 270,
    stock_quantity: 45,
    product_id: 'p-1',
    products: {
      id: 'p-1',
      product_name: 'Lechon Manok',
      is_grilled: true,
    },
  },
  {
    id: '2',
    branch_price: 250,
    stock_quantity: 20,
    product_id: 'p-2',
    products: {
      id: 'p-2',
      product_name: 'Pork Liempo',
      is_grilled: true,
    },
  },
  {
    id: '3',
    branch_price: 100,
    stock_quantity: 100,
    product_id: 'p-3',
    products: {
      id: 'p-3',
      product_name: 'Atchara',
      is_grilled: false,
    },
  },
];

export const Default: Story = {
  args: {
    selectedBranchId: '1',
    loading: false,
    inventory: mockInventory,
    editingId: null,
    editForm: { price: 0, stock: 0 },
  },
};

export const Loading: Story = {
  args: {
    selectedBranchId: '1',
    loading: true,
    inventory: [],
    editingId: null,
    editForm: { price: 0, stock: 0 },
  },
};

export const NoBranchSelected: Story = {
  args: {
    selectedBranchId: '',
    loading: false,
    inventory: [],
    editingId: null,
    editForm: { price: 0, stock: 0 },
  },
};

export const EditingItem: Story = {
  args: {
    selectedBranchId: '1',
    loading: false,
    inventory: mockInventory,
    editingId: '2',
    editForm: {
      price: 185,
      stock: 25,
    },
  },
};

export const EmptyInventory: Story = {
  args: {
    selectedBranchId: '1',
    loading: false,
    inventory: [],
    editingId: null,
    editForm: { price: 0, stock: 0 },
  },
};