import type { Meta, StoryObj } from '@storybook/react-vite';
import { Management } from '../../pages/Management';
import { http, HttpResponse, delay } from 'msw';

const meta: Meta<typeof Management> = {
  title: 'Pages/Management',
  component: Management,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Management>;

const mockBranches = [
  {
    id: 1,
    branch_name: 'Main Branch - Tacas',
    branch_address: 'Jaro, Iloilo City',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    branch_name: 'Dulangan Branch',
    branch_address: 'Dulangan, Pilar, Capiz',
    created_at: new Date().toISOString(),
  },
];

const mockStaff = [
  {
    id: 67,
    user_name: 'Raizel Shaine Yrac',
    user_pin: 1234,
    user_role: 'Owner',
  },
  {
    id: 76,
    user_name: 'Juan Miguel Davila',
    user_pin: 5678,
    user_role: 'Employee',
  },
];

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(/\/api\/management\/branches/, () => {
          console.log('MSW: Intercepted Branches Request');
          return HttpResponse.json(mockBranches);
        }),
        http.get(/\/api\/management\/users/, () => {
          console.log('MSW: Intercepted Staff Request');
          return HttpResponse.json(mockStaff);
        }),
      ],
    },
  },
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(/\/api\/management\/branches/, async () => {
          await delay('infinite');
          return HttpResponse.json([]);
        }),
        http.get(/\/api\/management\/users/, async () => {
          await delay('infinite');
          return HttpResponse.json([]);
        }),
      ],
    },
  },
};

export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(/\/api\/management\/branches/, () => {
          return HttpResponse.json([]);
        }),
        http.get(/\/api\/management\/users/, () => {
          return HttpResponse.json([]);
        }),
      ],
    },
  },
};

export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(/\/api\/management\/branches/, () => {
          return new HttpResponse(null, { status: 500 });
        }),
        http.get(/\/api\/management\/users/, () => {
          return new HttpResponse(null, { status: 500 });
        }),
      ],
    },
  },
};