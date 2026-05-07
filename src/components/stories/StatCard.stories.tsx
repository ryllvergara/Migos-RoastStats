// StatCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrendingUp, DollarSign, MapPin, ShoppingBag } from 'lucide-react';
import { StatCard } from '../StatCard';

const meta: Meta<typeof StatCard> = {
  title: 'Components/StatCard',
  component: StatCard,
  tags: ['autodocs'],
  argTypes: {
    isPositive: { control: 'boolean' },
  },
};
export default meta;

export const Default: StoryObj = {
  args: {
    label: 'Gross Sales Revenue',
    value: '₱12,400',
    trend: '12%',
    isPositive: true,
    icon: <DollarSign className="h-4 w-4" />,
  },
};

export const NegativeTrend: StoryObj = {
  args: {
    label: 'Gross Sales Revenue',
    value: '₱12,400',
    trend: '8%',
    isPositive: false,
    icon: <DollarSign className="h-4 w-4" />,
  },
};

export const ActualRevenue: StoryObj = {
  args: {
    label: 'Reconciled Sales Revenue',
    value: '₱10,400',
    trend: 'Actual Cash Collected',
    icon: <DollarSign className="h-4 w-4" />,
  },
};

export const DailyAverage: StoryObj = {
  args: {
    label: 'Daily Average',
    value: '₱2,500',
    trend: 'Past 7 days',
    icon: <TrendingUp className="h-4 w-4" />,
  },
};

export const TopBranch: StoryObj = {
  args: {
    label: 'Top Branch',
    value: 'Branch A',
    trend: 'Highest Revenue',
    icon: <MapPin className="h-4 w-4" />,
  },
};

export const TopProductByRevenue: StoryObj = {
  args: {
    label: 'Top Product',
    value: 'Liempo',
    trend: 'Revenue',
    icon: <ShoppingBag className="h-4 w-4" />,
  },
};

export const TopProductByQuantitySold: StoryObj = {
  args: {
    label: 'Top Product',
    value: 'Lechon Manok',
    trend: 'Quantity Sold',
    icon: <ShoppingBag className="h-4 w-4" />,
  },
};