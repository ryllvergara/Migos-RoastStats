import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { subDays, startOfWeek, endOfWeek } from 'date-fns';
import { WeekNavigator } from '../../components/analytics/WeekNavigator';

const meta: Meta<typeof WeekNavigator> = {
  title: 'Analytics/WeekNavigator',
  component: WeekNavigator,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', background: '#F8FAFC' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WeekNavigator>;

export const Interactive: Story = {
  render: (args) => {
    const [offset, setOffset] = useState(0);
    
    const baseDate = subDays(new Date(), offset * 7);
    const start = startOfWeek(baseDate, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(baseDate, { weekStartsOn: 1 });     // Sunday

    return (
      <WeekNavigator
        {...args}
        start={start}
        end={end}
        weekOffset={offset}
        onPrevWeek={() => setOffset(offset + 1)}
        onNextWeek={() => setOffset(Math.max(0, offset - 1))}
      />
    );
  },
  args: {
    // Initial mock values 
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
    weekOffset: 0,
  },
};

export const CurrentWeek: Story = {
  args: {
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
    weekOffset: 0,
  },
};

export const PastWeek: Story = {
  args: {
    start: startOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }),
    end: endOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }),
    weekOffset: 1,
  },
};