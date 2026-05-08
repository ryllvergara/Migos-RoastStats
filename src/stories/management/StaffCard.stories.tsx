import type { Meta, StoryObj } from '@storybook/react-vite';
import { StaffCard } from '../../components/management/StaffCard';
import { fn } from '@storybook/test';

const meta: Meta<typeof StaffCard> = {
  title: 'Management/StaffCard',
  component: StaffCard,
  parameters: {
    layout: 'centered',
  },
  args: {
    onEdit: fn(),
    onDelete: fn(),
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StaffCard>;

export const Default: Story = {
  args: {
    staff: {
      id: '1',
      user_name: 'Fritzie Mae Vergara',
      user_pin: '1234',
      user_role: 'Owner',
    },
  },
};

export const EmployeeRole: Story = {
  args: {
    staff: {
      id: '2',
      user_name: 'Kadoy',
      user_pin: '5678',
      user_role: 'Employee',
    },
  },
};

export const LongName: Story = {
  args: {
    staff: {
      id: '3',
      user_name: 'José Protasio Rizal Mercado y Alonso Realonda',
      user_pin: '0000',
      user_role: 'Employee',
    },
  },
};