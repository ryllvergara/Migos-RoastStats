import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductsManager } from '../../pages/ProductsManager';
import { http, HttpResponse, delay } from 'msw';

const meta: Meta<typeof ProductsManager> = {
  title: 'Pages/ProductsManager',
  component: ProductsManager,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ProductsManager>;

const mockBranches = [
  { id: 1, branch_name: 'Main Branch - Tacas' },
  { id: 2, branch_name: 'Dulangan Branch' },
];

const mockInventory = [
  {
    id: 1,
    branchId: 1,
    branch_price: 270,
    stock_quantity: 25,
    product_id: 1,
    products: {
      id: 1,
      product_name: 'Whole Lechon Manok',
      is_grilled: true,
    },
  },
  {
    id: 2,
    branchId: 2, 
    branch_price: 250,
    stock_quantity: 50,
    product_id: 2,
    products: {
      id: 2,
      product_name: 'Pork Liempo',
      is_grilled: true,
    },
  },
];

const inventoryHandler = http.get('*/api/products/branch/:branchId', ({ params }) => {
  const { branchId } = params;
  
  const filteredInventory = mockInventory.filter(
    (item) => item.branchId === Number(branchId)
  );

  console.log(`MSW: Intercepted Branch ${branchId}. Returning ${filteredInventory.length} items.`);
  return HttpResponse.json(filteredInventory);
});

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(/\/api\/management\/branches/, () => {
          return HttpResponse.json(mockBranches);
        }),
        inventoryHandler,
        http.patch(/\/api\/products\/inventory\//, () => {
          return HttpResponse.json({ success: true });
        }),
      ],
    },
  },
};

export const LoadingBranches: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(/\/api\/management\/branches/, async () => {
          await delay('infinite');
          return HttpResponse.json([]);
        }),
      ]
    }
  }
}

export const EmptyInventory: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(/\/api\/management\/branches/, () => {
          return HttpResponse.json(mockBranches);
        }),
        http.get('*/api/products/branch/:branchId', () => {
          return HttpResponse.json([]);
        }),
      ],
    },
  },
};