import type { Meta, StoryObj } from '@storybook/react-vite';
import { BranchCard } from '../../components/management/BranchCard';
import { fn } from '@storybook/test';

const meta: Meta<typeof BranchCard> = {
  title: 'Management/BranchCard',
  component: BranchCard,
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
type Story = StoryObj<typeof BranchCard>;

export const Default: Story = {
  args: {
    branch: {
      id: '1',
      branch_name: 'Main Branch - Tacas',
      branch_address: 'Jaro, Iloilo City',
      created_at: new Date().toISOString(),
    },
  },
};

export const LongDetails: Story = {
  args: {
    branch: {
      id: '2',
      branch_name: 'Central Philippine University - Lifestyle & Business Center Hub',
      branch_address: 'Lopez Jaena St, Jaro District, Iloilo City, 5000 Iloilo, Philippines',
    },
  },
};