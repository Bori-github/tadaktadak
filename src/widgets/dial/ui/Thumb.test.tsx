import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Canvas } from '@shopify/react-native-skia';
import { act, render, screen } from '@testing-library/react-native';
import { type SharedValue } from 'react-native-reanimated';

import { Thumb } from './Thumb';

import { type TimerMode } from '@/entities/timer';
import { COLORS } from '@/shared/constants';

// Jest에는 UI 스레드가 없음
jest.mock('react-native-reanimated', () => ({
  useDerivedValue: (compute: () => unknown) => ({ value: compute() }),
}));

// 색만 확인하므로 SharedValue의 나머지 멤버는 채우지 않음
const dialMinutes = (minutes: number) => ({ value: minutes }) as unknown as SharedValue<number>;

/** 타이머 모드에 따른 손잡이 색. */
const thumbColors = async (mode: TimerMode) => {
  // Canvas 밖에서는 Skia 노드가 만들어지지 않아 감쌈
  await render(
    <Canvas style={{ width: 200, height: 200 }}>
      <Thumb centerX={100} centerY={100} radius={60} dotSize={2} minutes={dialMinutes(25)} mode={mode} isTwinkling={false} />
    </Canvas>,
  );

  const colors = screen.container.queryAll((node) => node.type === 'skRect').map(({ props }) => props.color);

  return [...new Set(colors)];
};

const CASES: { label: string; mode: TimerMode; color: string; palette: string[] }[] = [
  { label: '집중', mode: 'focus', color: '크림', palette: [COLORS.focus.thumbArm, COLORS.focus.thumbCore] },
  { label: '휴식', mode: 'rest', color: '청록', palette: [COLORS.rest.thumbArm, COLORS.rest.thumbCore] },
];

describe('타이머 모드에 따른 손잡이 색', () => {
  it.each(CASES)('$label 손잡이는 $color색이다', async ({ mode, palette }) => {
    expect(await thumbColors(mode)).toEqual(palette);
  });
});

/** A는 도트 17개, B는 위아래 획이 없어 13개 */
const DOTS = { a: 17, b: 13 };

/** 지금 그려진 도트 수. A는 17개, B는 13개 */
const drawnDots = () => screen.container.queryAll((node) => node.type === 'skRect').length;

const FLICKER_MS = 125;

describe('반짝임 프레임 배선', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('반짝이는 동안 125밀리초마다 A와 B를 번갈아 그린다', async () => {
    await render(
      <Canvas style={{ width: 200, height: 200 }}>
        <Thumb centerX={100} centerY={100} radius={60} dotSize={2} minutes={dialMinutes(25)} mode="focus" isTwinkling />
      </Canvas>,
    );
    expect(drawnDots()).toBe(DOTS.a);

    await act(async () => {
      jest.advanceTimersByTime(FLICKER_MS);
    });
    expect(drawnDots()).toBe(DOTS.b);

    await act(async () => {
      jest.advanceTimersByTime(FLICKER_MS);
    });
    expect(drawnDots()).toBe(DOTS.a);
  });
});
