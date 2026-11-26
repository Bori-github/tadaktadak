import { type Meta, type StoryObj } from '@storybook/react-native-web-vite';

import { ChevronIcon } from './ChevronIcon';

const meta: Meta<typeof ChevronIcon> = {
  component: ChevronIcon,
  args: { dotSize: 2 },
};

export default meta;

export const Default: StoryObj<typeof ChevronIcon> = {};
