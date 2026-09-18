import { memo } from 'react';
import { Group, Rect } from '@shopify/react-native-skia';

import { COLORS, DOT_SIZE, ROUND_BUTTON_DIAMETER_IN_DOTS } from '@/shared/constants';
import { topLeftOnGrid } from '@/shared/lib';

import { type RectIcon } from '@/shared/ui/dot-icon';

import { circleCells, type DotRole } from './circle';

const CELLS = circleCells(ROUND_BUTTON_DIAMETER_IN_DOTS);

const ROLE_COLORS: Record<DotRole, string> = {
  edge: COLORS.button.edge,
  face: COLORS.button.face,
  highlight: COLORS.button.highlight,
  shadow: COLORS.button.shadow,
};

const DISABLED_ROLE_COLORS: Record<DotRole, string> = {
  edge: COLORS.button.lockedEdge,
  face: COLORS.button.lockedFace,
  highlight: COLORS.button.lockedFace,
  shadow: COLORS.button.lockedShadow,
};

type RoundDotButtonProps = {
  /** 버튼 중심 (px) */
  centerX: number;
  centerY: number;
  /** 도트 한 변 (px) */
  dotSize: number;
  icon: RectIcon;
  disabled?: boolean;
  pressed?: boolean;
};

export const RoundDotButton = memo(({ centerX, centerY, dotSize, icon, disabled = false, pressed = false }: RoundDotButtonProps) => {
  const size = ROUND_BUTTON_DIAMETER_IN_DOTS;
  const corner = topLeftOnGrid({ centerX, centerY, widthInDots: size, heightInDots: size, dotSize });
  const left = corner.left;
  // 눌리면 한 도트 내려앉음
  const top = corner.top + (pressed ? 1 : 0);

  // 눌리면 하이라이트를 면 색으로 덮음
  const colors = disabled ? DISABLED_ROLE_COLORS : ROLE_COLORS;
  const roleColor = (role: DotRole) => (pressed && role === 'highlight' ? colors.face : colors[role]);
  const iconColor = disabled ? COLORS.button.lockedIcon : COLORS.button.icon;

  // 아이콘 좌표가 배율 1 기준. 지금 도트 크기가 배율 1의 몇 배인지가 곱할 값
  const scale = dotSize / DOT_SIZE;
  const iconLeft = left * dotSize + (size * dotSize - icon.boxSize * scale) / 2;
  const iconTop = top * dotSize + (size * dotSize - icon.boxSize * scale) / 2;

  return (
    <Group antiAlias={false}>
      {CELLS.map((cell) => (
        <Rect
          key={`${cell.column}-${cell.row}`}
          x={(left + cell.column) * dotSize}
          y={(top + cell.row) * dotSize}
          width={cell.widthInDots * dotSize}
          height={dotSize}
          color={roleColor(cell.role)}
        />
      ))}
      {icon.rects.map(([x, y, width, height]) => (
        <Rect key={`${x}-${y}-${width}-${height}`} x={iconLeft + x * scale} y={iconTop + y * scale} width={width * scale} height={height * scale} color={iconColor} />
      ))}
    </Group>
  );
});

RoundDotButton.displayName = 'RoundDotButton';
