import type { Meta, StoryObj } from '@storybook/react-vite';
import { AddProductForm } from '../../components/productsManager/AddProductForm';
import { useState } from 'react';
import { fn } from '@storybook/test';

const meta: Meta<typeof AddProductForm> = {
  title: 'ProductsManager/AddProductForm',
  component: AddProductForm,
  parameters: {
    layout: 'centered',
  },
  args: {
    onSave: fn(),
    onCancel: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof AddProductForm>;

const InteractiveTemplate = (args: any) => {
  const [newProduct, setNewProduct] = useState(args.newProduct);

  return (
    <div className="w-[600px]">
      <AddProductForm
        {...args}
        newProduct={newProduct}
        onNewProductChange={setNewProduct}
        onSave={() => args.onSave(newProduct)}
      />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    branch: {
      id: '1',
      branch_name: 'Main Branch - Tacas',
    },
    newProduct: {
      name: '',
      price: 0,
      is_grilled: false,
      stock: 0,
    },
  },
};

export const PreFilled: Story = {
  render: (args) => <InteractiveTemplate {...args} />,
  args: {
    branch: {
      id: '2',
      branch_name: 'Dulangan Branch',
    },
    newProduct: {
      name: 'Lechon Manok',
      price: 270,
      is_grilled: true,
      stock: 50,
    },
  },
};
