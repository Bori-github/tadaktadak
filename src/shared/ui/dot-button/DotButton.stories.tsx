import { type Meta, type StoryObj } from '@storybook/react-native-web-vite';

import { DotButton } from './DotButton';
import { PLAY_ICON } from '@/shared/ui/dot-icon';

const meta: Meta<typeof DotButton> = {
  component: DotButton,
  args: { dotSize: 2, icon: PLAY_ICON, disabled: false, onPress: () => {} },
};

export default meta;

export const Enabled: StoryObj<typeof DotButton> = {};
export const Disabled: StoryObj<typeof DotButton> = { args: { disabled: true } };
