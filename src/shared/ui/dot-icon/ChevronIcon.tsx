import { type JSX } from 'react';
import { Canvas } from '@shopify/react-native-skia';

import { COLORS } from '@/shared/constants';

import { DotSprite } from '@/shared/ui/dot-sprite';

import { CHEVRON_ICON } from './chevron';

const CHEVRON_COLORS = { I: COLORS.icon.secondary };

type ChevronIconProps = {
  dotSize: number;
};

export const ChevronIcon = ({ dotSize }: ChevronIconProps): JSX.Element => {
  const width = (CHEVRON_ICON[0]?.length ?? 0) * dotSize;
  const height = CHEVRON_ICON.length * dotSize;

  return (
    <Canvas style={{ width, height }}>
      <DotSprite grid={CHEVRON_ICON} centerX={width / 2} centerY={height / 2} dotSize={dotSize} colors={CHEVRON_COLORS} />
    </Canvas>
  );
};
