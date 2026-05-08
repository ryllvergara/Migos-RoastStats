import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';
import { MenuItemButton } from '../../components/pos/MenuItemButton';

const meta: Meta<typeof MenuItemButton> = {
  title: 'POS/MenuItemButton',
  component: MenuItemButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-40">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    productName:  { control: 'text' },
    productPrice: { control: { type: 'number', min: 0, step: 10 } },
    isGrilled:    { control: 'boolean' },
    onGrill:      { control: { type: 'number', min: 0 } },
    stock:        { control: { type: 'number', min: 0 } },
    colorClass:   {
      control: 'radio',
      options: ['bg-[#D32F2F]', 'bg-[#212121]'],
    },
    hoverClass:   {
      control: 'radio',
      options: ['hover:bg-[#B71C1C]', 'hover:bg-[#424242]'],
    },
    onClick: { action: 'onClick' },
  },
};

export default meta;
type Story = StoryObj<typeof MenuItemButton>;

export const Default: Story = {
  args: {
    productName:  'Rice',
    productPrice: 35,
    isGrilled:    false,
    onGrill:      0,
    stock:        100,
    colorClass:   'bg-[#D32F2F]',
    hoverClass:   'hover:bg-[#B71C1C]',
    onClick:      fn(),
  },
};

export const NonGrilledOutOfStock: Story = {
  args: {
    ...Default.args,
    stock: 0,
  },
};

export const GrilledAvailable: Story = {
  args: {
    productName:  'Whole Lechon',
    productPrice: 7500,
    isGrilled:    true,
    onGrill:      5,
    stock:        20,
    colorClass:   'bg-[#D32F2F]',
    hoverClass:   'hover:bg-[#B71C1C]',
    onClick:      fn(),
  },
};

export const GrilledNoneOnGrill: Story = {
  args: {
    ...GrilledAvailable.args,
    onGrill: 0,
    stock:   20,
  },
};

export const GrilledOutOfStock: Story = {
  args: {
    ...GrilledAvailable.args,
    onGrill: 0,
    stock:   0,
  },
};

export const DarkVariant: Story = {
  args: {
    productName:  'Lechon Belly',
    productPrice: 2800,
    isGrilled:    false,
    onGrill:      0,
    stock:        15,
    colorClass:   'bg-[#212121]',
    hoverClass:   'hover:bg-[#424242]',
    onClick:      fn(),
  },
};
