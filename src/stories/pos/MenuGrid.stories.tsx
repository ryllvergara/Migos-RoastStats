import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';
import { MenuGrid } from '../../components/pos/MenuGrid';

const allProducts = [
  { id: 'p1', product_name: 'Whole Lechon',  product_price: 7500, is_grilled: true },
  { id: 'p2', product_name: 'Half Lechon',   product_price: 4500, is_grilled: true },
  { id: 'p3', product_name: 'Lechon Belly',  product_price: 2800, is_grilled: true },
  { id: 'p4', product_name: 'Lechon Paksiw', product_price: 180,  is_grilled: false },
  { id: 'p5', product_name: 'Rice',          product_price: 35,   is_grilled: false },
  { id: 'p6', product_name: 'Soda',          product_price: 45,   is_grilled: false },
  { id: 'p7', product_name: 'Water',         product_price: 20,   is_grilled: false },
];

const meta: Meta<typeof MenuGrid> = {
  title: 'POS/MenuGrid',
  component: MenuGrid,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-gray-50 p-6">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onSale: { action: 'onSale' },
  },
};

export default meta;
type Story = StoryObj<typeof MenuGrid>;

export const Default: Story = {
  args: {
    menuItems:    allProducts,
    grillCount:   { p1: 5, p2: 2, p3: 0 },
    branchStocks: { p1: 25, p2: 12, p3: 8, p4: 30, p5: 100, p6: 50, p7: 80 },
    onSale:       fn(),
  },
};

export const FullyAvailable: Story = {
  args: {
    menuItems:    allProducts,
    grillCount:   { p1: 8, p2: 6, p3: 4 },
    branchStocks: { p1: 30, p2: 20, p3: 15, p4: 30, p5: 100, p6: 50, p7: 80 },
    onSale:       fn(),
  },
};

export const AllOutOfStock: Story = {
  args: {
    menuItems:    allProducts,
    grillCount:   { p1: 0, p2: 0, p3: 0 },
    branchStocks: { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0, p7: 0 },
    onSale:       fn(),
  },
};

export const NonGrilledOnly: Story = {
  args: {
    menuItems:    allProducts.filter((p) => !p.is_grilled),
    grillCount:   {},
    branchStocks: { p4: 30, p5: 100, p6: 50, p7: 80 },
    onSale:       fn(),
  },
};

export const SingleItem: Story = {
  args: {
    menuItems:    [allProducts[0]],
    grillCount:   { p1: 3 },
    branchStocks: { p1: 20 },
    onSale:       fn(),
  },
};
