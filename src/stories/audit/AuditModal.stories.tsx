import type { Meta, StoryObj } from '@storybook/react-vite';
import { AuditModal } from '../../components/audit/AuditModal';

const meta: Meta<typeof AuditModal> = {
  title: 'Components/AuditModal',
  component: AuditModal,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: '5rem', background: '#f8fafc', minHeight: '700px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onClose: { action: 'closed' },
    onFinalize: { action: 'finalized' },
  },
};
export default meta;
type Story = StoryObj<typeof AuditModal>;

export const Default: Story = {
  args: {
    branchName: "Migo's Lechon - Main Branch",
    branchId: "123",
    onClose: () => console.log("Closed"),
    onFinalize: () => console.log("Finalized"),
    initialData: {
      employees: [{ name: "Kadoy" }],
      products: [
        {
          name: "Whole Lechon Manok",
          unitsSold: 15,
          pricePerUnit: 270,
          revenue: 0, 
          wastage: 1,
          remainingStocks: 5
        },
        {
          name: "Pork Liempo",
          unitsSold: 10,
          pricePerUnit: 250,
          revenue: 0,
          wastage: 0,
          remainingStocks: 2
        }
      ]
    }
  },
};