import type { Meta, StoryObj } from '@storybook/react-vite';
import { RegisterModal } from '../components/RegisterModal';

const meta: Meta<typeof RegisterModal> = {
  title: 'Components/RegisterModal',
  component: RegisterModal,
  tags: ['autodocs'],
  argTypes: {
    onClose: { action: 'closed' },
  },
};
export default meta;

export const Default: StoryObj = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
};

export const Closed: StoryObj = {
  args: {
    isOpen: false,
    onClose: () => {},
  },
};