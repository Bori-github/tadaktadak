import { type JSX } from 'react';
import { type Meta, type StoryObj } from '@storybook/react-native-web-vite';
import { Canvas } from '@shopify/react-native-skia';

import { usePalette } from '@/shared/lib';

import { DotSprite } from './DotSprite';
import { BONFIRE_HOT_A_9, BULB_ON, CAMPFIRE_SPRITE_COLORS, getSpriteColors, MARKER, WINTER_SPRITE_COLORS } from './sprites';

type DotSpritePreviewProps = { grid: readonly string[]; dotSize: number; colors?: Record<string, string | undefined> };

const DotSpritePreview = ({ grid, dotSize, colors }: DotSpritePreviewProps): JSX.Element => {
  const palette = usePalette();
  const width = (grid[0]?.length ?? 0) * dotSize;
  const height = grid.length * dotSize;

  return (
    <Canvas style={{ width, height }}>
      <DotSprite grid={grid} centerX={width / 2} centerY={height / 2} dotSize={dotSize} colors={colors ?? getSpriteColors(palette)} />
    </Canvas>
  );
};

const meta: Meta<typeof DotSpritePreview> = {
  component: DotSpritePreview,
  args: { dotSize: 2 },
};

export default meta;

export const Bonfire: StoryObj<typeof DotSpritePreview> = { args: { grid: BONFIRE_HOT_A_9, colors: CAMPFIRE_SPRITE_COLORS } };
export const Bulb: StoryObj<typeof DotSpritePreview> = { args: { grid: BULB_ON, colors: WINTER_SPRITE_COLORS } };
export const Marker: StoryObj<typeof DotSpritePreview> = { args: { grid: MARKER } };
