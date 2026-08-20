import { Group, Rect } from '@shopify/react-native-skia';

import { topLeftOnGrid } from '@/shared/lib';

import { SPRITE_COLORS } from './sprites';

type DotSpriteProps = {
  grid: readonly string[];
  /** 시계판 좌표계의 중심 (px) */
  centerX: number;
  centerY: number;
  /** 도트 한 변 (px) */
  dotSize: number;
  colors?: Record<string, string | undefined>;
  opacity?: number;
};

export const DotSprite = ({ grid, centerX, centerY, dotSize, colors = SPRITE_COLORS, opacity = 1 }: DotSpriteProps) => {
  const width = grid[0]?.length ?? 0;

  const { left, top } = topLeftOnGrid({ centerX, centerY, widthInDots: width, heightInDots: grid.length, dotSize });

  const dots = [];
  for (const [row, line] of grid.entries()) {
    for (let column = 0; column < width; column++) {
      const color = colors[line[column] ?? ''];
      if (!color) continue;
      dots.push({
        key: `${row}-${column}`,
        x: (left + column) * dotSize,
        y: (top + row) * dotSize,
        color,
      });
    }
  }

  return (
    <Group opacity={opacity} antiAlias={false}>
      {dots.map((dot) => (
        <Rect key={dot.key} x={dot.x} y={dot.y} width={dotSize} height={dotSize} color={dot.color} />
      ))}
    </Group>
  );
};
