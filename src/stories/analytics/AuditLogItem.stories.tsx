import type { Meta, StoryObj } from '@storybook/react-vite';
import { AuditLogItem } from '../../components/analytics/AuditLogItem';

const meta: Meta<typeof AuditLogItem> = {
  title: 'Analytics/AuditLogItem',
  component: AuditLogItem,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AuditLogItem>;

export const PerfectMatch: Story = {
  args: {
    log: {
      branches: { branch_name: 'Main Branch - Tacas' },
      audited_at: new Date().toISOString(),
      expected_revenue: 15400,
      actual_cash: 15400,
      variance: 0,
    },
  },
};

export const NegativeVariance: Story = {
  args: {
    log: {
      branches: { branch_name: 'Dulangan Branch' },
      audited_at: new Date().toISOString(),
      expected_revenue: 12000,
      actual_cash: 11850,
      variance: -150,
    },
  },
};

export const PositiveSurplus: Story = {
  args: {
    log: {
      branches: { branch_name: 'Jaro Branch' },
      audited_at: new Date().toISOString(),
      expected_revenue: 8500,
      actual_cash: 8650,
      variance: 150,
    },
  },
};

export const MissingBranchData: Story = {
  args: {
    log: {
      audited_at: new Date().toISOString(),
      expected_revenue: 5000,
      actual_cash: 5000,
      variance: 0,
    },
  },
};

export const LongBranchName: Story = {
  args: {
    log: {
      branches: { branch_name: 'Migo’s Lechon Manok - Mandurriao Extension' },
      audited_at: new Date().toISOString(),
      expected_revenue: 25000,
      actual_cash: 24995,
      variance: -5,
    },
  },
};