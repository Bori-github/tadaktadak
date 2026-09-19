import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ControlButtons } from './ControlButtons';

import { type TimerPhase } from '@/entities/timer';

let mockVibrations = 0;

jest.mock('@modules/haptic-pattern', () => ({
  hapticPattern: {
    play: () => {
      mockVibrations += 1;
    },
  },
}));

const pressed: string[] = [];

const buttons = async (phase: TimerPhase) => {
  pressed.length = 0;
  mockVibrations = 0;
  await render(<ControlButtons dotSize={2} phase={phase} onPlay={() => pressed.push('play')} onStop={() => pressed.push('stop')} />);

  return { play: screen.getByTestId('controls-play'), stop: screen.getByTestId('controls-stop') };
};

describe('누르면 해당 조작을 넘긴다', () => {
  it('대기 상태에서 재생 버튼', async () => {
    const { play } = await buttons('ready');
    await fireEvent.press(play);

    expect(pressed).toEqual(['play']);
  });

  it('진행 상태에서 정지 버튼', async () => {
    const { stop } = await buttons('running');
    await fireEvent.press(stop);

    expect(pressed).toEqual(['stop']);
  });

  it('완료 상태에서 재생 버튼', async () => {
    const { play } = await buttons('completed');
    await fireEvent.press(play);

    expect(pressed).toEqual(['play']);
  });
});

describe('대기 상태의 정지 버튼은 disabled 상태', () => {
  it('대기 상태에서 정지 버튼을 눌러도 조작을 넘기지 않는다', async () => {
    const { stop } = await buttons('ready');
    await fireEvent.press(stop);

    expect(pressed).toEqual([]);
  });

  it('대기 상태에서 정지 버튼을 누르는 순간 진동하지 않는다', async () => {
    const { stop } = await buttons('ready');
    await fireEvent(stop, 'pressIn');

    expect(mockVibrations).toBe(0);
  });
});
