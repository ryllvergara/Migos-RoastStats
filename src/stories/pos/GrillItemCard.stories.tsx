import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';import { GrillItemCard } from '../../components/pos/GrillItemCard';

const meta: Meta<typeof GrillItemCard> = {
  title: 'POS/GrillItemCard',
  component: GrillItemCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    productId:   { control: 'text' },
    productName: { control: 'text' },
    onGrill:     { control: { type: 'number', min: 0 } },
    stock:       { control: { type: 'number', min: 0 } },
    onDecrement: { action: 'onDecrement' },
    onIncrement: { action: 'onIncrement' },
  },
};

export default meta;
type Story = StoryObj<typeof GrillItemCard>;

const baseArgs = {
  productId:   'prod-1',
  productName: 'Whole Lechon',
  onDecrement: fn(),
  onIncrement: fn(),
};

export const Default: Story = {
  args: { ...baseArgs, onGrill: 5, stock: 30 },
};

export const NoneOnGrill: Story = {
  args: { ...baseArgs, onGrill: 0, stock: 30 },
};

export const LowStock: Story = {
  args: { ...baseArgs, onGrill: 3, stock: 6 },
};

export const LowStockBoundary: Story = {
  args: { ...baseArgs, onGrill: 2, stock: 10 },
};

export const OutOfStock: Story = {
  args: { ...baseArgs, onGrill: 0, stock: 0 },
};

export const OnGrillButFreezerEmpty: Story = {
  args: { ...baseArgs, onGrill: 4, stock: 0 },
};

export const HighCount: Story = {
  args: { ...baseArgs, onGrill: 24, stock: 50 },
};
