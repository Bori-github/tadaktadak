import { type Meta, type StoryObj } from '@storybook/react-native-web-vite';

import { createBackIcon, createCloseIcon } from './icons';
import { IconButton } from './IconButton';

const meta: Meta<typeof IconButton> = {
  component: IconButton,
  args: { dotSize: 2, icon: createCloseIcon, onPress: () => {} },
};

export default meta;

export const Close: StoryObj<typeof IconButton> = {};
export const Back: StoryObj<typeof IconButton> = { args: { icon: createBackIcon } };
