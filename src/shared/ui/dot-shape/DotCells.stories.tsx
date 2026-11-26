import { type JSX } from 'react';
import { type Meta, type StoryObj } from '@storybook/react-native-web-vite';
import { Canvas } from '@shopify/react-native-skia';

import { usePalette } from '@/shared/lib';

import { bubbleShape } from './bubble';
import { type DotCell } from './cell';
import { circleCells } from './circle';
import { DotCells } from './DotCells';
import { rectangleCells } from './rectangle';
import { roundedRectangleShape } from './roundedRectangle';

type DotCellsPreviewProps = { cells: readonly DotCell[]; widthInDots: number; heightInDots: number; dotSize: number };

const DotCellsPreview = ({ cells, widthInDots, heightInDots, dotSize }: DotCellsPreviewProps): JSX.Element => {
  const { button } = usePalette();

  return (
    <Canvas style={{ width: widthInDots * dotSize, height: heightInDots * dotSize }}>
      <DotCells cells={cells} dotSize={dotSize} colors={{ edge: button.edge, face: button.face, highlight: button.highlight, shadow: button.shadow }} />
    </Canvas>
  );
};

const meta: Meta<typeof DotCellsPreview> = {
  component: DotCellsPreview,
  args: { dotSize: 2 },
};

export default meta;

export const Rectangle: StoryObj<typeof DotCellsPreview> = {
  args: { cells: rectangleCells({ widthInDots: 40, heightInDots: 12 }), widthInDots: 40, heightInDots: 12 },
};
export const Circle: StoryObj<typeof DotCellsPreview> = {
  args: { cells: circleCells(24), widthInDots: 24, heightInDots: 24 },
};
export const RoundedRectangle: StoryObj<typeof DotCellsPreview> = {
  args: roundedRectangleShape({ widthInDots: 40, heightInDots: 12 }),
};
export const Bubble: StoryObj<typeof DotCellsPreview> = {
  args: bubbleShape({ contentWidthInDots: 40, contentHeightInDots: 12, arrowDirection: 'up', arrowAlign: 'center' }),
};
