import type { Meta, StoryObj } from '@storybook/react-vite';
import { BranchDialog } from '../../components/management/BranchDialog';
import { useState } from 'react';
import { fn } from '@storybook/test';

const meta: Meta<typeof BranchDialog> = {
  title: 'Management/BranchDialog',
  component: BranchDialog,
  parameters: {
    layout: 'centered',
  },
  args: {
    onSave: fn(),
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BranchDialog>;

const InteractiveTemplate = (args: any) => {
  const [open, setOpen] = useState(args.open);
  const [formData, setFormData] = useState(args.formData);

  return (
    <BranchDialog
      {...args}
      open={open}
      onOpenChange={setOpen}
      formData={formData}
      onFormChange={setFormData}
      onSave={() => {
        args.onSave();
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
      address: '',
    },
  },
};

export const EditMode: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    open: true,
    isEditing: true,
    formData: {
      name: 'Main Branch - Tacas',
      address: 'Jaro, Iloilo City',
    },
  },
};

export const Closed: Story = {
  args: {
    open: false,
    isEditing: false,
    formData: {
      name: '',
      address: '',
    },
  },
};