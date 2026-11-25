interface Keyframe {
  s?: number[];
}

interface AnimatableVector {
  // 위치를 x/y로 나눠 저장한 Lottie는 k 대신 x, y 사용
  k?: (number | Keyframe)[];
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

const getMaxY = ({ k }: AnimatableVector): number | null => {
  if (!k) return null;
  const vectors = isStaticVector(k) ? [k] : k.flatMap((keyframe) => (typeof keyframe === 'number' || !keyframe.s ? [] : [keyframe.s]));

  return vectors.length === 0 ? null : Math.max(...vectors.map(([, y = 0]) => y));
};

const getRectBottoms = (shapes: LottieShape[]): number[] =>
  shapes.flatMap((shape) => {
    if (shape.ty === 'gr') return getRectBottoms(shape.it ?? []);
    if (shape.ty !== 'rc' || !shape.p || !shape.s) return [];
    const y = getMaxY(shape.p);
    const height = getMaxY(shape.s);
    if (y === null || height === null) return [];

    // 사각형 위치는 중심
    return [y + height / 2];
  });

/**
 * Lottie 사각형 도트가 그려지는 가장 아래 y
 *
 * 사각형 도형(`rc`)만 계산하며, 레이어 크기 조절/회전/기준점/부모 레이어와 그룹 변환은 반영하지 않고 위치를 x/y로 나눠 저장한 레이어는 제외
 * 위치는 키프레임 값만 사용해 키프레임 사이 보간 구간은 반영하지 않으며, 투명도 0 구간과 레이어 표시 시간 밖의 위치도 포함
 *
 * @param lottie - Lottie JSON
 * @param lottie.layers - 레이어 목록
 * @returns 모든 키프레임 중 가장 아래 사각형 도트의 하단 y. 계산할 사각형 도트가 없으면 null
 */
export const getLottieDotBottom = ({ layers }: DotLottie): number | null => {
  const bottoms = layers.flatMap((layer) => {
    const layerY = getMaxY(layer.ks.p);
    const rectBottoms = getRectBottoms(layer.shapes ?? []);
    if (layerY === null || rectBottoms.length === 0) return [];

    return [layerY + Math.max(...rectBottoms)];
  });

  return bottoms.length === 0 ? null : Math.max(...bottoms);
};
