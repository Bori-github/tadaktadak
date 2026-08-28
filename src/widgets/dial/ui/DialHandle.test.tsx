import { describe, expect, it, jest } from '@jest/globals';
import { Canvas } from '@shopify/react-native-skia';
import { render, screen } from '@testing-library/react-native';
import { type SharedValue } from 'react-native-reanimated';

import { DialHandle } from './DialHandle';

import { type TimerMode } from '@/entities/timer';
import { COLORS } from '@/shared/constants';

// Jest에는 UI 스레드가 없음
jest.mock('react-native-reanimated', () => ({
  useDerivedValue: (compute: () => unknown) => ({ value: compute() }),
}));

// 색만 확인하므로 SharedValue의 나머지 멤버는 채우지 않음
const dialMinutes = (minutes: number) => ({ value: minutes }) as unknown as SharedValue<number>;

/** 타이머 모드에 따른 손잡이 색. */
const handleColors = async (mode: TimerMode) => {
  // Canvas 밖에서는 Skia 노드가 만들어지지 않아 감쌈
  await render(
    <Canvas style={{ width: 200, height: 200 }}>
      <DialHandle centerX={100} centerY={100} radius={60} dotSize={2} minutes={dialMinutes(25)} mode={mode} />
    </Canvas>,
  );

  const colors = screen.container.queryAll((node) => node.type === 'skRect').map(({ props }) => props.color);

  return [...new Set(colors)];
};

const CASES: { label: string; mode: TimerMode; color: string; palette: string[] }[] = [
  { label: '집중', mode: 'focus', color: '크림', palette: [COLORS.focus.handleArm, COLORS.focus.handleCore] },
  { label: '휴식', mode: 'rest', color: '청록', palette: [COLORS.rest.handleArm, COLORS.rest.handleCore] },
];

describe('타이머 모드에 따른 손잡이 색', () => {
  it.each(CASES)('$label 손잡이는 $color색이다', async ({ mode, palette }) => {
    expect(await handleColors(mode)).toEqual(palette);
  });
});
