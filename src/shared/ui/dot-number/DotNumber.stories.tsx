import { type JSX } from 'react';
import { type Meta, type StoryObj } from '@storybook/react-native-web-vite';
import { Canvas } from '@shopify/react-native-skia';

import { usePalette } from '@/shared/lib';

import { DotNumber } from './DotNumber';
import { dotNumberSize } from './glyph';

type DotNumberPreviewProps = { text: string; dotSize: number; glyphScale: number };

const DotNumberPreview = ({ text, dotSize, glyphScale }: DotNumberPreviewProps): JSX.Element => {
  const palette = usePalette();
  const { widthInDots, heightInDots } = dotNumberSize(text, glyphScale);
  const width = widthInDots * dotSize;
  const height = heightInDots * dotSize;

  return (
    <Canvas style={{ width, height }}>
      <DotNumber text={text} centerX={width / 2} centerY={height / 2} color={palette.focus.numeral} dotSize={dotSize} glyphScale={glyphScale} />
    </Canvas>
  );
};

const meta: Meta<typeof DotNumberPreview> = {
  component: DotNumberPreview,
  args: { dotSize: 2, text: '25:00', glyphScale: 1 },
};

export default meta;

export const Time: StoryObj<typeof DotNumberPreview> = {};
export const Digits: StoryObj<typeof DotNumberPreview> = { args: { text: '0123456789' } };
export const Scaled: StoryObj<typeof DotNumberPreview> = { args: { text: '60', glyphScale: 2 } };
