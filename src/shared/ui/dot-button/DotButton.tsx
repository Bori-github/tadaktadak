import { Group, Rect } from '@shopify/react-native-skia';

import { BUTTON_SIZE_IN_DOTS, COLORS } from '@/shared/constants';
import { topLeftOnGrid } from '@/shared/lib';

import { DotSprite } from '@/shared/ui/dot-sprite';
import { ICONS, type IconName } from './icons';

/** 리벳이 놓이는 모서리 안쪽 거리 (dot) */
const RIVET_INSET = 3;

const RIVETS: readonly (readonly [number, number])[] = [
  [RIVET_INSET, RIVET_INSET],
  [BUTTON_SIZE_IN_DOTS - 1 - RIVET_INSET, RIVET_INSET],
  [RIVET_INSET, BUTTON_SIZE_IN_DOTS - 1 - RIVET_INSET],
  [BUTTON_SIZE_IN_DOTS - 1 - RIVET_INSET, BUTTON_SIZE_IN_DOTS - 1 - RIVET_INSET],
];

const ICON_COLORS = { I: COLORS.button.icon };
const LOCKED_ICON_COLORS = { I: COLORS.button.lockedIcon };

type Cell = { key: string; x: number; y: number; width: number; height: number; color: string };

type DotButtonProps = {
  /** 버튼 중심 (px) */
  centerX: number;
  centerY: number;
  /** 도트 한 변 (px) */
  dotSize: number;
  icon: IconName;
  /** 잠긴 버튼은 면과 아이콘이 어두워지고 하이라이트 없음 */
  enabled?: boolean;
  pressed?: boolean;
};

export const DotButton = ({ centerX, centerY, dotSize, icon, enabled = true, pressed = false }: DotButtonProps) => {
  const size = BUTTON_SIZE_IN_DOTS;
  const corner = topLeftOnGrid({ centerX, centerY, widthInDots: size, heightInDots: size, dotSize });
  const left = corner.left;
  // 눌리면 한 도트 내려앉음
  const top = corner.top + (pressed ? 1 : 0);

  const { highlight } = COLORS.button;
  const edge = enabled ? COLORS.button.edge : COLORS.button.lockedEdge;
  const face = enabled ? COLORS.button.face : COLORS.button.lockedFace;
  const shadow = enabled ? COLORS.button.shadow : COLORS.button.lockedShadow;

  const cells: Cell[] = [
    { key: 'face', x: 0, y: 0, width: size, height: size, color: face },
    { key: 'edge-top', x: 0, y: 0, width: size, height: 1, color: edge },
    { key: 'edge-bottom', x: 0, y: size - 1, width: size, height: 1, color: edge },
    { key: 'edge-left', x: 0, y: 0, width: 1, height: size, color: edge },
    { key: 'edge-right', x: size - 1, y: 0, width: 1, height: size, color: edge },
  ];

  if (enabled && !pressed) {
    cells.push(
      { key: 'highlight-top', x: 1, y: 1, width: size - 2, height: 1, color: highlight },
      { key: 'highlight-left', x: 1, y: 1, width: 1, height: size - 2, color: highlight },
    );
  }

  // 그림자는 하이라이트보다 나중에 그림. 겹치는 도트 두 칸 (1, size-2)·(size-2, 1)은 시안이 그림자 색
  cells.push(
    { key: 'shadow-bottom', x: 1, y: size - 2, width: size - 2, height: 1, color: shadow },
    { key: 'shadow-right', x: size - 2, y: 1, width: 1, height: size - 2, color: shadow },
  );

  for (const [x, y] of RIVETS) {
    cells.push({ key: `rivet-${x}-${y}`, x, y, width: 1, height: 1, color: edge });
  }

  return (
    <Group antiAlias={false}>
      {cells.map((cell) => (
        <Rect key={cell.key} x={(left + cell.x) * dotSize} y={(top + cell.y) * dotSize} width={cell.width * dotSize} height={cell.height * dotSize} color={cell.color} />
      ))}
      <DotSprite
        grid={ICONS[icon]}
        centerX={(left + size / 2) * dotSize}
        centerY={(top + size / 2) * dotSize}
        dotSize={dotSize}
        colors={enabled ? ICON_COLORS : LOCKED_ICON_COLORS}
      />
    </Group>
  );
};
