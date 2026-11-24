import { Skia, TileMode, type SkColor, type SkImage, type SkRect } from '@shopify/react-native-skia';

import { clockwisePhase } from './phase';
import { DOT_SIZE } from '@/shared/constants';

/** 5분 개체, 1분 개체 빛 반지름 (논리 픽셀, 배율 1) */
export type GlowRadius = { major: number; minor: number };

/**
 * `drawBloom` 텍스처 안의 반지름별 사각형
 *
 * @param radius - 5분 개체, 1분 개체 빛 반지름
 * @returns 5분 개체 사각형을 왼쪽, 1분 개체 사각형을 오른쪽에 둔 배치
 */
export const glowSprites = ({ major, minor }: GlowRadius): Record<keyof GlowRadius, SkRect> => ({
  major: Skia.XYWHRect(0, 0, major * 2, major * 2),
  minor: Skia.XYWHRect(major * 2, 0, minor * 2, minor * 2),
});

/**
 * 반지름별 빛 번짐 텍스처 두 장. 그릴 때 알파와 스케일만 변경. `DESIGN.md` §6
 *
 * @param gradient - `getBloomGradient` 결과
 * @param radius - 5분 개체, 1분 개체 빛 반지름
 * @returns 표면 생성 실패 시 `null`
 */
export const drawBloom = (gradient: SkColor[], radius: GlowRadius): SkImage | null => {
  const sprites = glowSprites(radius);
  const surface = Skia.Surface.Make((radius.major + radius.minor) * 2, radius.major * 2);
  if (!surface) return null;

  const canvas = surface.getCanvas();

  canvas.clear(Skia.Color('transparent'));

  for (const [rect, spriteRadius] of [
    [sprites.major, radius.major],
    [sprites.minor, radius.minor],
  ] as const) {
    const paint = Skia.Paint();
    const center = { x: rect.x + spriteRadius, y: rect.y + spriteRadius };

    paint.setShader(Skia.Shader.MakeRadialGradient(center, spriteRadius, gradient, [0, 1], TileMode.Clamp));
    canvas.drawRect(rect, paint);
  }

  surface.flush();

  return surface.makeImageSnapshot();
};

/**
 * 빛 번짐 그러데이션
 *
 * @param color - 가운데 색. 바깥쪽은 같은 색의 알파 0
 * @returns 가운데에서 바깥쪽 순서의 색
 */
export const getBloomGradient = (color: string): SkColor[] => {
  const core = Skia.Color(color);
  const fade = core.slice();
  fade[3] = 0;

  return [core, fade];
};

/** 가운데 빛 번짐 반지름. 개체 반지름에 곱함. `DESIGN.md` §6 */
export const CENTER_BLOOM_RATIO = 0.95;

/** 가운데 빛 번짐 알파. `DESIGN.md` §6 */
export const CENTER_BLOOM_ALPHA = 0.24;

/** 빛 번짐 반지름 (논리 픽셀, 배율 1). `DESIGN.md` §6 */
export const BLOOM_RADIUS: GlowRadius = { major: 32, minor: 16 };

/** 빛 번짐 알파. `DESIGN.md` §6 */
export const BLOOM_ALPHA = { major: 0.55, minor: 0.32 };

/** 후광 반지름 (논리 픽셀, 배율 1) */
export const HALO_RADIUS: GlowRadius = { major: 10, minor: 6 };

export const HALO_ALPHA = 0.7;

type BloomRadiusInput = {
  tick: number;
  isMajorTick: boolean;
  progress: number;
  step: number;
  dotSize: number;
};

/**
 * 눈금 하나의 빛 번짐 반지름 (px). `DESIGN.md` §6
 *
 * @param input.tick - 시계판 눈금 번호. 12시 다음이 1
 * @param input.isMajorTick - 5분 개체 눈금 여부
 * @param input.progress - 불이 붙은 정도. 0은 꺼짐, 1은 다 붙음
 * @param input.step - 불꽃 프레임 순서. 눈금마다 세 단계로 어긋난 깜빡임을 만듦
 * @param input.dotSize - 도트 한 변 (px)
 * @returns 붙은 정도와 깜빡임과 배율을 곱한 반지름
 */
export const bloomRadius = ({ tick, isMajorTick, progress, step, dotSize }: BloomRadiusInput): number => {
  const base = isMajorTick ? BLOOM_RADIUS.major : BLOOM_RADIUS.minor;
  const flicker = 0.9 + 0.1 * clockwisePhase(step, tick, 3);

  return base * (0.55 + 0.45 * progress) * flicker * (dotSize / DOT_SIZE);
};
