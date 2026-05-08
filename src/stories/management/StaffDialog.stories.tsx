import type { Meta, StoryObj } from '@storybook/react-vite';
import { StaffDialog } from '../../components/management/StaffDialog';
import { useState } from 'react';
import { fn } from '@storybook/test';

const meta: Meta<typeof StaffDialog> = {
  title: 'Management/StaffDialog',
  component: StaffDialog,
  parameters: {
    layout: 'centered',
  },
  args: {
    onSave: fn(),
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StaffDialog>;

const InteractiveTemplate = (args: any) => {
  const [open, setOpen] = useState(args.open);
  const [formData, setFormData] = useState(args.formData);

  return (
    <StaffDialog
      {...args}
      open={open}
      onOpenChange={setOpen}
      formData={formData}
      onFormChange={setFormData}
      onSave={() => {
        args.onSave(formData);
        setOpen(false); 
      }}
    />
  );
};

export const CreateMode: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    open: true,
    isEditing: false,
    formData: {
      name: '',
      pin: '',
      role: 'employee',
    },
  },
};

export const EditMode: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    open: true,
    isEditing: true,
    formData: {
      name: 'Fritzie Mae Vergara',
      pin: '1234',
      role: 'Owner',
    },
  },
};

export const Closed: Story = {
  args: {
    open: false,
    isEditing: false,
    formData: {
      name: '',
      pin: '',
      role: 'employee',
    },
  },
};