import { type JSX } from 'react';
import { type Meta, type StoryObj } from '@storybook/react-native-web-vite';
import { Canvas } from '@shopify/react-native-skia';

import { DOT_SIZE } from '@/shared/constants';
import { usePalette } from '@/shared/lib';

import { RectIconShape } from './RectIconShape';
import { SETTINGS_ICON } from './settings';
import { SOUND_ICON } from './sound';
import { type RectIcon } from './types';
import { WARNING_ICON } from './warning';

const RectIconPreview = ({ icon, dotSize }: { icon: RectIcon; dotSize: number }): JSX.Element => {
  const palette = usePalette();
  const size = (icon.boxSize * dotSize) / DOT_SIZE;

  return (
    <Canvas style={{ width: size, height: size }}>
      <RectIconShape icon={icon} left={0} top={0} dotSize={dotSize} color={palette.icon.default} />
    </Canvas>
  );
};

const meta: Meta<typeof RectIconPreview> = {
  component: RectIconPreview,
  args: { dotSize: 2, icon: SOUND_ICON },
};

export default meta;

export const Sound: StoryObj<typeof RectIconPreview> = {};
export const Settings: StoryObj<typeof RectIconPreview> = { args: { icon: SETTINGS_ICON } };
export const Warning: StoryObj<typeof RectIconPreview> = { args: { icon: WARNING_ICON } };
