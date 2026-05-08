import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';
import { POSHeader } from '../../components/pos/POSHeader';

const meta: Meta<typeof POSHeader> = {
  title: 'POS/POSHeader',
  component: POSHeader,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-gray-50 p-4">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    branchName:   { control: 'text' },
    userName:     { control: 'text' },
    totalRevenue: { control: { type: 'number', min: 0, step: 100 } },
    loading:      { control: 'boolean' },
    onSync:       { action: 'onSync' },
  },
};

export default meta;
type Story = StoryObj<typeof POSHeader>;

export const Default: Story = {
  args: {
    branchName:   'Migo Main',
    userName:     'Maria Santos',
    totalRevenue: 12450,
    loading:      false,
    onSync:       fn(),
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
  },
};

export const ZeroRevenue: Story = {
  args: {
    ...Default.args,
    totalRevenue: 0,
  },
};

export const HighRevenue: Story = {
  args: {
    ...Default.args,
    totalRevenue: 98750.5,
  },
};

export const LongBranchName: Story = {
  args: {
    ...Default.args,
    branchName: 'Migo\'s Lechon - Mandurriao Branch',
    userName:   'Alejandro Reyes Villanueva',
  },
};
