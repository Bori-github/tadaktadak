import { type JSX } from 'react';
import { Group, Rect } from '@shopify/react-native-skia';

import { type DotCell, type DotRole } from './cell';

type DotCellsProps = {
  cells: readonly DotCell[];
  /** 도트 한 변 (px) */
  dotSize: number;
  colors: Record<DotRole, string>;
  /** 도형 전체를 아래로 옮기는 거리 (px) */
  offsetY?: number;
};

export const DotCells = ({ cells, dotSize, colors, offsetY = 0 }: DotCellsProps): JSX.Element => (
  <Group antiAlias={false}>
    {cells.map((cell) => (
      <Rect
        key={cell.key}
        x={cell.column * dotSize}
        y={offsetY + cell.row * dotSize}
        width={cell.widthInDots * dotSize}
        height={cell.heightInDots * dotSize}
        color={colors[cell.role]}
      />
    ))}
  </Group>
);
