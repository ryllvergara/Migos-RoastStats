import type { Meta, StoryObj } from '@storybook/react-vite';
import { Analytics } from '../../pages/Analytics';

const meta: Meta<typeof Analytics> = {
  title: 'Pages/Analytics',
  component: Analytics,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Analytics>;

const mockDashboardData = {
  summary: {
    totalRevenue: 59830,
    growth: -40,
    reconciledRevenue: 59620,
    dailyAverage: 8574.14,
  },
  logs: [
    {
      branches: { branch_name: 'Main Branch' },
      audited_at: new Date('2026-05-04'),
      expected_revenue: 11380,
      actual_cash: 11380,
      variance: 0,
    },
    {
      branches: { branch_name: 'Dulangan Branch' },
      audited_at: new Date('2026-05-04'),
      expected_revenue: 12500,
      actual_cash: 12300,
      variance: -200,
    },
    {
      branches: { branch_name: 'Tinda Branch' },
      audited_at: new Date('2026-05-04'),
      expected_revenue: 7500,
      actual_cash: 7500,
      variance: 0,
    },
    {
      branches: { branch_name: 'Main Branch' },
      audited_at: new Date('2026-05-05'),
      expected_revenue: 10450,
      actual_cash: 10440,
      variance: -10,
    },
    {
      branches: { branch_name: 'Dulangan Branch' },
      audited_at: new Date('2026-05-05'),
      expected_revenue: 11200,
      actual_cash: 11200,
      variance: 0,
    },
    {
      branches: { branch_name: 'Tinda Branch' },
      audited_at: new Date('2026-05-05'),
      expected_revenue: 6800,
      actual_cash: 6800,
      variance: 0,
    },
  ],
  reports: [
    { product_name: 'Lechon Manok', product_revenue: 43240, quantity_sold: 188 },
    { product_name: 'Pork Liempo', product_revenue: 16590, quantity_sold: 79 },
  ],
};

export const Default: Story = {
  args: {
    initialData: mockDashboardData,
  },
};

export const Loading: Story = {
  args: {
    initialData: null, 
  },
};