import { Group, Rect } from '@shopify/react-native-skia';

import { topLeftOnGrid } from '@/shared/lib';

import { GLYPH, GLYPH_GAP, GLYPH_WIDTH, dotNumberSize } from './glyph';

type DotNumberProps = {
  text: string;
  /** 시계판 좌표계의 중심 (px) */
  centerX: number;
  centerY: number;
  color: string;
  /** 도트 한 변 (px) */
  dotSize: number;
  glyphScale?: number;
  opacity?: number;
};

export const DotNumber = ({ text, centerX, centerY, color, dotSize, glyphScale = 1, opacity = 1 }: DotNumberProps) => {
  const advance = GLYPH_WIDTH + GLYPH_GAP;
  const { widthInDots, heightInDots } = dotNumberSize(text, glyphScale);

  const { left, top } = topLeftOnGrid({ centerX, centerY, widthInDots, heightInDots, dotSize });
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
};
