import { type Meta, type StoryObj } from '@storybook/react-native-web-vite';

import { RoundDotButton } from './RoundDotButton';
import { SOUND_ICON } from '@/shared/ui/dot-icon';

const meta: Meta<typeof RoundDotButton> = {
  component: RoundDotButton,
  args: { dotSize: 2, icon: SOUND_ICON, disabled: false, onPress: () => {} },
};

export default meta;

export const Enabled: StoryObj<typeof RoundDotButton> = {};
export const Disabled: StoryObj<typeof RoundDotButton> = { args: { disabled: true } };
