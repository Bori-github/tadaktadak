import { Group, Rect } from '@shopify/react-native-skia';

import { GLYPH, GLYPH_GAP, GLYPH_HEIGHT, GLYPH_WIDTH } from './glyph';

type DotNumberProps = {
  text: string;
  /** 시계판 좌표계의 중심 (px) */
  centerX: number;
  centerY: number;
  color: string;
  /** 배율 1에서 도트 한 변 (px) */
  dotSize: number;
  glyphScale?: number;
  opacity?: number;
};

export function DotNumber({ text, centerX, centerY, color, dotSize, glyphScale = 1, opacity = 1 }: DotNumberProps) {
  const advance = GLYPH_WIDTH + GLYPH_GAP;
  const widthInDots = (text.length * advance - GLYPH_GAP) * glyphScale;

  // 중심은 실수로 잡고 왼쪽 위 모서리에서 격자에 맞춘다. `DESIGN.md` §5
  const left = Math.round(centerX / dotSize - widthInDots / 2);
  const top = Math.round(centerY / dotSize - (GLYPH_HEIGHT * glyphScale) / 2);
  const size = dotSize * glyphScale;

  const dots = [];
  for (const [index, character] of [...text].entries()) {
    const glyph = GLYPH[character];
    if (!glyph) continue;

    for (const [row, line] of glyph.entries()) {
      for (let column = 0; column < GLYPH_WIDTH; column++) {
        if (line[column] !== '#') continue;
        dots.push({
          key: `${index}-${row}-${column}`,
          x: (left + (index * advance + column) * glyphScale) * dotSize,
          y: (top + row * glyphScale) * dotSize,
        });
      }
    }
  }

  return (
    <Group opacity={opacity} antiAlias={false}>
      {dots.map((dot) => (
        <Rect key={dot.key} x={dot.x} y={dot.y} width={size} height={size} color={color} />
      ))}
    </Group>
  );
}
