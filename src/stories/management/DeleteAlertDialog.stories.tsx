import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeleteAlertDialog } from '../../components/management/DeleteAlertDialog';
import { useState } from 'react';
import { fn } from '@storybook/test';

const meta: Meta<typeof DeleteAlertDialog> = {
  title: 'Management/DeleteAlertDialog',
  component: DeleteAlertDialog,
  parameters: {
    layout: 'centered',
  },
  args: {
    onConfirm: fn(),
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DeleteAlertDialog>;

const InteractiveTemplate = (args: any) => {
  const [open, setOpen] = useState(args.open);

  return (
    <DeleteAlertDialog
      {...args}
      open={open}
      onOpenChange={setOpen}
      onConfirm={() => {
        args.onConfirm();
        setOpen(false);  
      }}
    />
  );
};

export const Default: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    open: true,  
  },
};

export const Closed: Story = {
  args: {
    open: false, 
  },
};