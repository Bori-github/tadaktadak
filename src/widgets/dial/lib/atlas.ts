import { FilterMode, MipmapMode } from '@shopify/react-native-skia';

/** 도트를 키워도 칸 사이가 흐려지지 않음. 가장 가까운 원본 픽셀 하나의 색을 그대로 씀. `DESIGN.md` §6 */
export const DOT_SAMPLING = { filter: FilterMode.Nearest, mipmap: MipmapMode.None };

/** 빛 번짐을 키울 때는 가장자리를 흐림. 가까운 원본 픽셀 넷을 거리 비율로 섞음. `DESIGN.md` §6 */
export const SOFT_SAMPLING = { filter: FilterMode.Linear, mipmap: MipmapMode.None };

/** 여러 격자를 담은 이미지 한 장(아틀라스) 안에서 격자 하나가 차지하는 자리 (dot) */
type SpriteBox = {
  left: number;
  top: number;
  widthInDots: number;
  heightInDots: number;
};

/** 격자 사이 여백 (dot). 확대할 때 이웃 격자의 픽셀이 함께 표본화되는 것 방지 */
const GUTTER_IN_DOTS = 1;

export type PackedSprites = {
  /** 격자를 다 담은 이미지의 크기 (dot) */
  image: { widthInDots: number; heightInDots: number };
  boxes: SpriteBox[];
};

/**
 * 도트 격자 여럿을 이미지 한 장에 나란히 놓기
 *
 * @param grids - 놓을 격자. 넘긴 순서가 `boxes` 순서
 * @returns 이미지 크기와 격자별 사각형
 */
export const packSprites = (grids: readonly (readonly string[])[]): PackedSprites => {
  let left = 0;
  const boxes = grids.map((grid) => {
    const box = { left, top: 0, widthInDots: Math.max(0, ...grid.map((line) => line.length)), heightInDots: grid.length };
    left += box.widthInDots + GUTTER_IN_DOTS;
    return box;
  });

  return {
    image: {
      widthInDots: Math.max(0, left - GUTTER_IN_DOTS),
      heightInDots: boxes.reduce((tallest, box) => Math.max(tallest, box.heightInDots), 0),
    },
    boxes,
  };
};
