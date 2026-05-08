import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';
import { GrillStatusPanel } from '../../components/pos/GrillStatusPanel';

const grilledProducts = [
  { id: 'p1', product_name: 'Whole Lechon',  product_price: 7500, is_grilled: true },
  { id: 'p2', product_name: 'Half Lechon',   product_price: 4500, is_grilled: true },
  { id: 'p3', product_name: 'Lechon Belly',  product_price: 2800, is_grilled: true },
];

const meta: Meta<typeof GrillStatusPanel> = {
  title: 'POS/GrillStatusPanel',
  component: GrillStatusPanel,
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
    onDecrement: fn(),
    onIncrement: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof GrillStatusPanel>;

const callbacks = {
  onDecrement: fn(),
  onIncrement: fn(),
};

export const Default: Story = {
  args: {
    grilledProducts,
    grillCount:   { p1: 5, p2: 3, p3: 1 },
    branchStocks: { p1: 30, p2: 15, p3: 8 },
    ...callbacks,
  },
};

export const SingleProduct: Story = {
  args: {
    grilledProducts: [grilledProducts[0]],
    grillCount:      { p1: 5 },
    branchStocks:    { p1: 30 },
    ...callbacks,
  },
};

export const AllOutOfStock: Story = {
  args: {
    grilledProducts,
    grillCount:   { p1: 2, p2: 0, p3: 0 },
    branchStocks: { p1: 0, p2: 0, p3: 0 },
    ...callbacks,
  },
};

export const AllLowStock: Story = {
  args: {
    grilledProducts,
    grillCount:   { p1: 3, p2: 2, p3: 1 },
    branchStocks: { p1: 4, p2: 7, p3: 2 },
    ...callbacks,
  },
};

export const Empty: Story = {
  args: {
    grilledProducts: [],
    grillCount:      {},
    branchStocks:    {},
    ...callbacks,
  },
};
