import { type ViewStyle } from 'react-native';

type TouchAreaPlacement = {
  /** 버튼 중심 (px) */
  centerX: number;
  centerY: number;
  /** 터치 영역 한 변 (px) */
  size: number;
};

/**
 * 버튼 중심에 맞춘 정사각형 터치 영역. `DESIGN.md` §4
 *
 * Skia 노드는 터치를 받지 못해 버튼마다 `Pressable`을 겹쳐 둔다
 *
 * @returns 절대 위치 스타일 (px)
 */
export const touchArea = ({ centerX, centerY, size }: TouchAreaPlacement): ViewStyle => ({
  position: 'absolute',
  left: centerX - size / 2,
  top: centerY - size / 2,
  width: size,
  height: size,
});
