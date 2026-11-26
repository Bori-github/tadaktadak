import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from '@jest/globals';

import { getLottieDotBottom } from './lottieDotBottom';

import { THEME_IDS } from '@/entities/theme';

interface Keyframe {
  t: number;
  s: number[];
  h?: number;
}

interface Animatable {
  a?: number;
  k?: number | (number | Keyframe)[];
  // 위치를 x/y로 나눠 저장한 값
  s?: boolean;
}

interface Vector extends Animatable {
  k?: (number | Keyframe)[];
}

interface Shape {
  ty: string;
  it?: Shape[];
  p?: Vector;
  s?: Vector;
  a?: Animatable;
  r?: Animatable;
  c?: Animatable;
}

interface Layer {
  nm: string;
  ip: number;
  op: number;
  parent?: number;
  ks: { o: Animatable; p: Vector; a: Animatable; s: Animatable; r: Animatable };
  shapes?: Shape[];
}

interface LottieFile {
  w: number;
  h: number;
  fr: number;
  layers: Layer[];
}

const DOT = 2;
const LOTTIE_DIRECTORY = join(process.cwd(), 'assets/lottie');
const FILES = readdirSync(LOTTIE_DIRECTORY);
const readLottie = (file: string): LottieFile => JSON.parse(readFileSync(join(LOTTIE_DIRECTORY, file), 'utf8'));
const LOTTIES = FILES.map((file) => ({ file, lottie: readLottie(file) }));
const ERROR_LOTTIES = LOTTIES.filter(({ file }) => file.startsWith('error-'));
const SPLASH_LOTTIES = LOTTIES.filter(({ file }) => file.startsWith('splash-'));

const getKeyframes = ({ k }: Animatable): Keyframe[] => (Array.isArray(k) ? k.filter((value): value is Keyframe => typeof value !== 'number') : []);

const getFrameZeroValue = (animatable: Animatable): number[] => {
  const { k } = animatable;
  if (k === undefined) return [];
  if (typeof k === 'number') return [k];
  const keyframes = getKeyframes(animatable);
  if (keyframes.length === 0) return k.filter((value): value is number => typeof value === 'number');

  return ([...keyframes].reverse().find((keyframe) => keyframe.t <= 0) ?? keyframes[0])?.s ?? [];
};

// 값이 없거나 움직이지 않고 모든 성분이 expected인 변환
const isStillAt = (animatable: Animatable | undefined, expected: number): boolean =>
  animatable === undefined || (animatable.a !== 1 && getFrameZeroValue(animatable).every((value) => value === expected));

const flattenShapes = (shapes: Shape[]): Shape[] => shapes.flatMap((shape) => [shape, ...flattenShapes(shape.it ?? [])]);

const getDotLayers = ({ layers }: LottieFile): Layer[] => layers.filter((layer) => flattenShapes(layer.shapes ?? []).some((shape) => shape.ty === 'rc'));

const toHex = (rgba: number[]): string =>
  rgba
    .slice(0, 3)
    .map((channel) =>
      Math.round(channel * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');

// 그룹 안 사각형을 2px 도트 왼쪽 위 좌표와 색으로 분해
const getShapeDots = (shapes: Shape[], [originX = 0, originY = 0]: number[]): string[] => {
  const fill = shapes.find((shape) => shape.ty === 'fl');
  const color = fill?.c ? toHex(getFrameZeroValue(fill.c)) : '';

  return shapes.flatMap((shape) => {
    if (shape.ty === 'gr') return getShapeDots(shape.it ?? [], [originX, originY]);
    if (shape.ty !== 'rc' || !shape.p || !shape.s) return [];
    const [centerX = 0, centerY = 0] = getFrameZeroValue(shape.p);
    const [width = 0, height = 0] = getFrameZeroValue(shape.s);
    const dots: string[] = [];
    for (let y = centerY - height / 2; y < centerY + height / 2; y += DOT) {
      for (let x = centerX - width / 2; x < centerX + width / 2; x += DOT) dots.push(`${originX + x},${originY + y},${color}`);
    }

    return dots;
  });
};

const isVisibleAtFrameZero = (layer: Layer): boolean => layer.ip <= 0 && 0 < layer.op && (getFrameZeroValue(layer.ks.o)[0] ?? 100) > 0;

const getFrameZeroDots = (layers: Layer[]): string[] =>
  layers
    .filter((layer) => isVisibleAtFrameZero(layer))
    .flatMap((layer) => getShapeDots(layer.shapes ?? [], getFrameZeroValue(layer.ks.p)))
    .sort();

describe('Lottie 파일', () => {
  it('테마마다 스플래시와 에러 화면 Lottie가 있다', () => {
    expect(FILES).toEqual(expect.arrayContaining(THEME_IDS.flatMap((themeId) => [`splash-${themeId}.json`, `error-${themeId}.json`])));
  });

  it('모든 Lottie의 캔버스 크기와 프레임 속도가 같다', () => {
    expect(new Set(LOTTIES.map(({ lottie: { w, h, fr } }) => `${w},${h},${fr}`)).size).toBe(1);
  });

  it('스플래시 Lottie의 첫 프레임은 네이티브 로고와 같다', () => {
    const campfire = readLottie('splash-campfire.json');
    const logoDots = getFrameZeroDots(campfire.layers.filter(({ nm }) => nm === 'logs' || nm === 'match'));

    expect(logoDots).toHaveLength(23);
    SPLASH_LOTTIES.forEach(({ lottie }) => {
      expect(getFrameZeroDots(lottie.layers)).toEqual(logoDots);
    });
  });

  it('에러 화면 Lottie는 그림 하단을 계산할 수 있다', () => {
    expect(ERROR_LOTTIES.filter(({ lottie }) => getLottieDotBottom(lottie) === null).map(({ file }) => file)).toEqual([]);
  });

  it('에러 화면 Lottie의 도트 레이어는 위치 외 변환을 사용하지 않는다', () => {
    const violations = ERROR_LOTTIES.flatMap(({ file, lottie }) =>
      getDotLayers(lottie)
        .filter(({ parent, ks, shapes = [] }) => {
          const hasLayerTransform = parent !== undefined || ks.p.s === true || !isStillAt(ks.s, 100) || !isStillAt(ks.a, 0) || !isStillAt(ks.r, 0);
          const hasGroupTransform = flattenShapes(shapes).some(
            (shape) => shape.ty === 'tr' && (!isStillAt(shape.p, 0) || !isStillAt(shape.a, 0) || !isStillAt(shape.s, 100) || !isStillAt(shape.r, 0)),
          );

          return hasLayerTransform || hasGroupTransform;
        })
        .map(({ nm }) => `${file} ${nm}`),
    );

    expect(violations).toEqual([]);
  });

  it('에러 화면 Lottie의 움직이는 도트는 홀드 키프레임을 사용한다', () => {
    const isHold = (animatable: Animatable | undefined): boolean =>
      animatable === undefined
        ? true
        : getKeyframes(animatable)
            .slice(0, -1)
            .every(({ h }) => h === 1);
    const violations = ERROR_LOTTIES.flatMap(({ file, lottie }) =>
      getDotLayers(lottie)
        .filter(({ ks, shapes = [] }) => !isHold(ks.p) || flattenShapes(shapes).some((shape) => shape.ty === 'rc' && (!isHold(shape.p) || !isHold(shape.s))))
        .map(({ nm }) => `${file} ${nm}`),
    );

    expect(violations).toEqual([]);
  });
});
