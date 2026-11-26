import { type Meta, type StoryObj } from '@storybook/react-native-web-vite';

import { DotTextButton } from './DotTextButton';

const meta: Meta<typeof DotTextButton> = {
  component: DotTextButton,
  args: { dotSize: 2, widthInDots: 40, heightInDots: 12, label: '다시 시작', onPress: () => {} },
};

export default meta;

export const Default: StoryObj<typeof DotTextButton> = {};
