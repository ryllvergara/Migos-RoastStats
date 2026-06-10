import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ProductPieChart, ProductChartData } from '../../components/analytics/ProductPieChart';

const meta: Meta<typeof ProductPieChart> = {
  title: 'Analytics/ProductPieChart',
  component: ProductPieChart,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '450px', margin: '0 auto', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProductPieChart>;

const mockData: ProductChartData[] = [
  { name: 'Lechon Manok', value: 45000, revenue: 45000, units: 180 },
  { name: 'Pork Liempo', value: 32000, revenue: 32000, units: 125 },
  { name: 'Spicy Lechon Manok', value: 28000, revenue: 28000, units: 110 },
  { name: '1.5L Coke', value: 8500, revenue: 8500, units: 85 },
  { name: 'Extra Sauce', value: 1200, revenue: 1200, units: 240 },
];

export const Interactive: Story = {
  render: (args) => {
    const [viewType, setViewType] = useState<'revenue' | 'quantity'>(args.viewType);
        
    const adjustedData = args.data.map(item => ({
      ...item,
      value: viewType === 'revenue' ? item.revenue : item.units
    }));

    return (
      <ProductPieChart
        {...args}
        data={adjustedData}
        viewType={viewType}
        onViewTypeChange={setViewType}
      />
    );
  },
  args: {
    data: mockData,
    viewType: 'revenue',
  },
};

export const QuantityView: Story = {
  args: {
    data: mockData.map(item => ({ ...item, value: item.units })),
    viewType: 'quantity',
  },
};

export const EmptyState: Story = {
  args: {
    data: [],
    viewType: 'revenue',
  },
};

export const SingleProduct: Story = {
  args: {
    data: [mockData[0]],
    viewType: 'revenue',
  },
};