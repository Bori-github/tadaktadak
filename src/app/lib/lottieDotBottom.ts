interface Keyframe {
  s?: number[];
}

interface AnimatableVector {
  k: (number | Keyframe)[];
}

interface LottieShape {
  ty: string;
  it?: LottieShape[];
  p?: AnimatableVector;
  s?: AnimatableVector;
}

interface LottieLayer {
  ks: { p: AnimatableVector };
  shapes?: LottieShape[];
}

export interface DotLottie {
  layers: LottieLayer[];
}

const isStaticVector = (values: (number | Keyframe)[]): values is number[] => values.every((value) => typeof value === 'number');

const getMaxY = ({ k }: AnimatableVector): number => {
  const vectors = isStaticVector(k) ? [k] : k.flatMap((keyframe) => (typeof keyframe === 'number' || !keyframe.s ? [] : [keyframe.s]));

  return Math.max(...vectors.map(([, y = 0]) => y));
};

const getRectBottoms = (shapes: LottieShape[]): number[] =>
  shapes.flatMap((shape) => {
    if (shape.ty === 'gr') return getRectBottoms(shape.it ?? []);
    if (shape.ty !== 'rc' || !shape.p || !shape.s) return [];

    // 사각형 위치는 중심
    return [getMaxY(shape.p) + getMaxY(shape.s) / 2];
  });

/**
 * Lottie 사각형 도트가 그려지는 가장 아래 y
 *
 * 사각형 도형(`rc`)만 계산하며, 레이어 크기 조절/회전/기준점/부모 레이어, 그룹 변환, x/y 분리 위치 미반영
 * 위치는 키프레임 값만 계산해 보간 구간 미반영, 투명도 0 구간과 레이어 표시 시간 밖의 위치 포함
 *
 * @param lottie - Lottie JSON
 * @param lottie.layers - 레이어 목록
 * @returns 모든 키프레임 중 가장 아래 사각형 도트의 하단 y
 */
export const getLottieDotBottom = ({ layers }: DotLottie): number =>
  Math.max(
    ...layers.flatMap((layer) => {
      const rectBottoms = getRectBottoms(layer.shapes ?? []);
      if (rectBottoms.length === 0) return [];

      return [getMaxY(layer.ks.p) + Math.max(...rectBottoms)];
    }),
  );
