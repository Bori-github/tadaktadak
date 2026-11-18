import { memo } from 'react';

import { pointOnDial } from '../lib/geometry';
import { type Palette } from '@/shared/lib';
import { DotNumber } from '@/shared/ui/dot-number';

const NUMERAL_VALUES = Array.from({ length: 12 }, (_, index) => index * 5);

type NumeralsProps = {
  centerX: number;
  centerY: number;
  radius: number;
  dotSize: number;
  palette: Palette;
};

export const Numerals = memo(({ centerX, centerY, radius, dotSize, palette }: NumeralsProps) => {
  return (
    <>
      {NUMERAL_VALUES.map((value) => {
        const point = pointOnDial(centerX, centerY, radius, value * 6);
        return <DotNumber key={value} text={String(value)} centerX={point.x} centerY={point.y} color={palette.focus.numeral} dotSize={dotSize} />;
      })}
    </>
  );
});

Numerals.displayName = 'Numerals';
