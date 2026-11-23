import { gridDots, type ColoredDot } from './atlas';
import { pointOnDial } from './geometry';
import { noise, topLeftOnGrid } from '@/shared/lib';

/** 솔잎 4단계 색. 명도 오름차순. 피그마 `wreath/needle-*` */
const NEEDLE = ['#16291f', '#1f3a2a', '#2a4f36', '#3a6a45'] as const;
const OUTLINE = '#0c1a12';
const HIGHLIGHT = '#5f9e5c';

/** 열매 스프라이트. o 테두리, H 반사광, B 몸통. 피그마 `berry/*` */
const BERRY = ['.oo.', 'oHBo', 'oBBo', '.oo.'];
const BERRY_COLORS: Record<string, string> = { o: '#4a0f18', H: '#ff8a7a', B: '#b8303a' };
const BERRY_SIZE = BERRY.length;

/** 열매 묶음 내 3개 위치 (dot). 접선 방향, 안쪽 법선 방향 오프셋 순 */
const BERRY_OFFSETS = [
  [0, 0],
  [3, 1],
  [1, 3.5],
] as const;

interface LeafRing {
  /** 첫 잎 각도와 간격 (도) */
  from: number;
  step: number;
  /** 개체 중심 반지름 기준 반지름 방향 오프셋 (dot) */
  offset: number;
  /** 접선 기준 바깥쪽 기울기 (도) */
  tilt: (degrees: number) => number;
  /** 잎 타원의 반길이, 반너비 (dot) */
  length: number;
  width: number;
  /** 잎별 명도 편차 시드 */
  seed: number;
}

/** 그리기 순서는 안쪽, 바깥, 가운데 줄. 나중 줄이 앞 줄을 덮음 */
const LEAF_RINGS: LeafRing[] = [
  { from: 0, step: 5, offset: -2.5, tilt: () => -38, length: 4.5, width: 1.7, seed: 148 },
  { from: 2.5, step: 5, offset: 2.5, tilt: () => 38, length: 4.5, width: 1.7, seed: 158 },
  { from: 1, step: 4, offset: 0, tilt: (degrees) => (Math.round(degrees) % 8 < 4 ? 22 : -22), length: 5, width: 1.9, seed: 153 },
];

type LeafInput = {
  degrees: number;
  ring: LeafRing;
  center: { x: number; y: number };
  origin: { x: number; y: number };
  ringRadius: number;
  put: (x: number, y: number, color: string) => void;
};

/** 잎 하나. 끝으로 갈수록 좁아지는 타원, 왼쪽 위 광원 */
const drawLeaf = ({ degrees, ring, center, origin, ringRadius, put }: LeafInput) => {
  const radians = (degrees * Math.PI) / 180;
  const tilt = (ring.tilt(degrees) * Math.PI) / 180;
  const tangent = [Math.cos(radians), Math.sin(radians)] as const;
  const outward = [Math.sin(radians), -Math.cos(radians)] as const;
  const direction = [tangent[0] * Math.cos(tilt) + outward[0] * Math.sin(tilt), tangent[1] * Math.cos(tilt) + outward[1] * Math.sin(tilt)] as const;
  const across = [-direction[1], direction[0]] as const;

  const inside = (x: number, y: number): number | null => {
    const dx = x + 0.5 - center.x;
    const dy = y + 0.5 - center.y;
    const u = dx * direction[0] + dy * direction[1];
    const v = dx * across[0] + dy * across[1];
    const halfWidth = ring.width * (1 - Math.max(0, u / ring.length) * 0.5);

    return (u / ring.length) ** 2 + (v / halfWidth) ** 2 <= 1 ? v : null;
  };

  const light = (-(center.x - origin.x) - (center.y - origin.y)) / (2 * ringRadius);
  const shade = Math.min(3, Math.max(0, Math.round(1.4 + light * 1.6 + (noise(degrees, ring.seed) - 0.5) * 1.2)));
  const span = ring.length + 2;

  for (let y = Math.floor(center.y - span); y <= center.y + span; y++) {
    for (let x = Math.floor(center.x - span); x <= center.x + span; x++) {
      const v = inside(x, y);
      if (v === null) continue;

      const isRim = inside(x + 1, y) === null || inside(x - 1, y) === null || inside(x, y + 1) === null || inside(x, y - 1) === null;
      if (isRim) put(x, y, OUTLINE);
      else if (v < -ring.width * 0.15 && shade >= 2) put(x, y, HIGHLIGHT);
      else put(x, y, NEEDLE[v < 0 ? shade : Math.max(0, shade - 1)] ?? NEEDLE[0]);
    }
  }
};

type WreathInput = {
  /** 시계판 중심 (px) */
  centerX: number;
  centerY: number;
  /** 개체 중심 반지름 (px) */
  radius: number;
  /** 도트 한 변 (px) */
  dotSize: number;
};

/**
 * 리스 잎과 열매 도트. 잎과 열매 크기는 배율과 무관하게 도트 수로 고정
 *
 * @param input.centerX - 시계판 중심 x (px)
 * @param input.centerY - 시계판 중심 y (px)
 * @param input.radius - 개체 중심 반지름 (px)
 * @param input.dotSize - 도트 한 변 (px)
 * @returns 화면 도트 격자 좌표. 좌표 중복 시 마지막 색만 유지
 */
export const wreathDots = ({ centerX, centerY, radius, dotSize }: WreathInput): ColoredDot[] => {
  const origin = { x: centerX / dotSize, y: centerY / dotSize };
  const ringRadius = radius / dotSize;
  const dots = new Map<string, ColoredDot>();
  const put = (x: number, y: number, color: string) => {
    dots.set(`${x},${y}`, { x, y, color });
  };
  for (const ring of LEAF_RINGS) {
    for (let degrees = ring.from; degrees < 360; degrees += ring.step) {
      drawLeaf({ degrees, ring, center: pointOnDial(origin.x, origin.y, ringRadius + ring.offset, degrees), origin, ringRadius, put });
    }
  }

  for (let cluster = 0; cluster < 12; cluster++) {
    const degrees = cluster * 30 + 13.5;
    const radians = (degrees * Math.PI) / 180;
    const center = pointOnDial(origin.x, origin.y, ringRadius + 2, degrees);

    for (const [along, across] of BERRY_OFFSETS) {
      const { left, top } = topLeftOnGrid({
        centerX: center.x + along * Math.cos(radians) - across * Math.sin(radians),
        centerY: center.y + along * Math.sin(radians) + across * Math.cos(radians),
        widthInDots: BERRY_SIZE,
        heightInDots: BERRY_SIZE,
        dotSize: 1,
      });

      for (const dot of gridDots(BERRY, BERRY_COLORS, left, top)) put(dot.x, dot.y, dot.color);
    }
  }

  return [...dots.values()];
};
