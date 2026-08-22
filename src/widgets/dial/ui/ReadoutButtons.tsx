import { Pressable } from 'react-native';

import { FOCUS_SIZE, REST_OFFSET_IN_DOTS, REST_SIZE, TOUCH_MARGIN } from '../config/readout';

import { type TimerMode } from '@/entities/timer';

type Size = { widthInDots: number; heightInDots: number };

/**
 * 글자 상자에 여백을 두른 사각형.
 *
 * @param centerX - 글자 중심 (px)
 * @param centerY - 글자 중심 (px)
 * @param size - 글자 상자의 도트 단위 가로·세로
 * @param dotSize - 도트 한 변 (px)
 * @returns 절대 위치 스타일 (px)
 */
const touchArea = (centerX: number, centerY: number, size: Size, dotSize: number) =>
  ({
    position: 'absolute',
    left: centerX - (size.widthInDots / 2) * dotSize - TOUCH_MARGIN,
    top: centerY - (size.heightInDots / 2) * dotSize - TOUCH_MARGIN,
    width: size.widthInDots * dotSize + TOUCH_MARGIN * 2,
    height: size.heightInDots * dotSize + TOUCH_MARGIN * 2,
  }) as const;

type ReadoutButtonsProps = {
  /** 시계판 중심 (px) */
  centerX: number;
  centerY: number;
  /** 도트 한 변 (px) */
  dotSize: number;
  onSelect: (target: TimerMode) => void;
};

export const ReadoutButtons = ({ centerX, centerY, dotSize, onSelect }: ReadoutButtonsProps) => (
  <>
    <Pressable accessibilityRole="button" style={touchArea(centerX, centerY, FOCUS_SIZE, dotSize)} onPress={() => onSelect('focus')} />
    <Pressable accessibilityRole="button" style={touchArea(centerX, centerY + REST_OFFSET_IN_DOTS * dotSize, REST_SIZE, dotSize)} onPress={() => onSelect('rest')} />
  </>
);
