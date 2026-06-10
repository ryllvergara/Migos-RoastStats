import type { Meta, StoryObj } from '@storybook/react-vite';
import { BranchBarChart } from '../../components/analytics/BranchBarChart';

const meta: Meta<typeof BranchBarChart> = {
  title: 'Analytics/BranchBarChart',
  component: BranchBarChart,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', background: '#f8fafc', minHeight: '500px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BranchBarChart>;

const weeklyData = [
  { day: 'Mon', 'Main Branch': 12000, 'Dulangan Branch': 8000, 'Tinda Branch': 5000 },
  { day: 'Tue', 'Main Branch': 11000, 'Dulangan Branch': 9500, 'Tinda Branch': 4500 },
  { day: 'Wed', 'Main Branch': 15000, 'Dulangan Branch': 11000, 'Tinda Branch': 6000 },
  { day: 'Thu', 'Main Branch': 13000, 'Dulangan Branch': 10500, 'Tinda Branch': 5500 },
  { day: 'Fri', 'Main Branch': 22000, 'Dulangan Branch': 18000, 'Tinda Branch': 12000 },
  { day: 'Sat', 'Main Branch': 28000, 'Dulangan Branch': 24000, 'Tinda Branch': 15000 },
  { day: 'Sun', 'Main Branch': 25000, 'Dulangan Branch': 21000, 'Tinda Branch': 14000 },
];

export const MultiBranchComparison: Story = {
  args: {
    data: weeklyData,
  },
};

export const SingleBranch: Story = {
  args: {
    data: weeklyData.map(({ day, 'Main Branch': main }) => ({ day, 'Main Branch': main })),
  },
};

export const NewBranchExpansion: Story = {
  args: {
    data: weeklyData.map(d => ({
      ...d,
      'Jaro Branch': Math.floor(Math.random() * 4000) + 2000
    })),
  },
};

export const EmptyState: Story = {
  args: {
    data: [],
  },
};