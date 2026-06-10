import type { Meta, StoryObj } from '@storybook/react-vite';
import { Audit } from '../../pages/Audit';
import { http, HttpResponse } from 'msw';
import { within, userEvent } from '@storybook/testing-library';

const meta: Meta<typeof Audit> = {
  title: 'Pages/Audit',
  component: Audit,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Audit>;

const mockBranches = [
  { 
    id: 'branch-123', 
    branch_name: "Main Branch - CPU", 
    last_audit_status: 'ready_for_audit', 
    location: 'Jaro, Iloilo City' 
  },
  { 
    id: 'branch-456', 
    branch_name: 'Jaro Plaza', 
    last_audit_status: 'active', 
    location: 'Jaro Plaza, Iloilo City' 
  },
];

const mockAuditDetails = {
  employees: [{ name: "Kadoy" }],
  products: [
    { name: "Whole Lechon Manok", unitsSold: 15, pricePerUnit: 270, revenue: 4050, wastage: 1, remainingStocks: 5 },
    { name: "Pork Liempo", unitsSold: 10, pricePerUnit: 250, revenue: 2500, wastage: 0, remainingStocks: 12 }
  ],
  totalExpected: 6550
};

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(/\/management\/branches/, () => {
          return HttpResponse.json(mockBranches);
        }),
      ],
    },
  },
};

export const AuditInProgress: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(/\/management\/branches/, () => {
          return HttpResponse.json(mockBranches);
        }),
        http.get('*/audit/details/branch-123', () => {
          return HttpResponse.json(mockAuditDetails);
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const auditButton = await canvas.findByText(/Review Shift Details/i);
    await userEvent.click(auditButton);
  },
};

export const AllAudited: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(/\/management\/branches/, () => {
          const allActive = mockBranches.map(b => ({ ...b, last_audit_status: 'active' }));
          return HttpResponse.json(allActive);
        }),
      ],
    },
  },
};