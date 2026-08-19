import { Group, Rect } from '@shopify/react-native-skia';

import { SPRITE_COLORS } from './sprites';

type DotSpriteProps = {
  grid: readonly string[];
  /** 시계판 좌표계의 중심 (px) */
  centerX: number;
  centerY: number;
  /** 배율 1에서 도트 한 변 (px) */
  dotSize: number;
  opacity?: number;
};

export function DotSprite({ grid, centerX, centerY, dotSize, opacity = 1 }: DotSpriteProps) {
  const width = grid[0]?.length ?? 0;

  // 중심은 실수로 잡고 왼쪽 위 모서리에서 격자에 맞춘다. `DESIGN.md` §5
  const left = Math.round(centerX / dotSize - width / 2);
  const top = Math.round(centerY / dotSize - grid.length / 2);

  const dots = [];
  for (const [row, line] of grid.entries()) {
    for (let column = 0; column < width; column++) {
      const color = SPRITE_COLORS[line[column] ?? ''];
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
}
