import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AuditLogsSection } from '../../components/analytics/AuditLogsSection';

const meta: Meta<typeof AuditLogsSection> = {
  title: 'Analytics/AuditLogsSection',
  component: AuditLogsSection,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AuditLogsSection>;

const mockLogs = [
  {
    branches: { branch_name: 'Main Branch - Tacas' },
    audited_at: new Date().toISOString(),
    expected_revenue: 28450,
    actual_cash: 28450,
    variance: 0,
  },
  {
    branches: { branch_name: 'Tinda Branch' },
    audited_at: new Date(Date.now() - 86400000).toISOString(),
    expected_revenue: 15200,
    actual_cash: 14950,
    variance: -250,
  },
  {
    branches: { branch_name: 'Dulangan Branch' },
    audited_at: new Date(Date.now() - 172800000).toISOString(),
    expected_revenue: 12300,
    actual_cash: 12400,
    variance: 100,
  }
];

export const Interactive: Story = {
  render: (args) => {
    const [show, setShow] = useState(args.showLogs);
    return (
      <AuditLogsSection 
        {...args} 
        showLogs={show} 
        onToggle={() => setShow(!show)} 
      />
    );
  },
  args: {
    logs: mockLogs,
    showLogs: false,
  },
};

export const AlwaysOpen: Story = {
  args: {
    logs: mockLogs,
    showLogs: true,
  },
};

export const EmptyLogs: Story = {
  render: (args) => {
    const [show, setShow] = useState(args.showLogs);
    return (
      <AuditLogsSection 
        {...args} 
        showLogs={show} 
        onToggle={() => setShow(!show)} 
      />
    );
  },
  args: {
    logs: [],
    showLogs: false,
  },
};