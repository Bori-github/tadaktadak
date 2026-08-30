import { describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ControlButtons } from './ControlButtons';

import { type TimerPhase } from '@/entities/timer';

/** 기준 화면 iPhone 17e의 가로 중심. `DESIGN.md` §5 */
const CENTER_X = 195;

/** 버튼 줄 세로 위치. 값에는 뜻이 없고 좌우 배치만 봄 */
const CENTER_Y = 700;

type Rect = { left: number; top: number; width: number; height: number };

const pressed: string[] = [];

const buttons = async (phase: TimerPhase, dotSize = 2) => {
  pressed.length = 0;
  await render(
    <ControlButtons
      centerX={CENTER_X}
      centerY={CENTER_Y}
      dotSize={dotSize}
      phase={phase}
      onPlay={() => pressed.push('play')}
      onStop={() => pressed.push('stop')}
      onPressedChange={() => {}}
    />,
  );

  const [play, stop] = screen.getAllByRole('button');
  if (!play || !stop) throw new Error('버튼이 둘이 아니다');

  return { play, stop };
};

const rect = ({ props }: { props: Record<string, unknown> }): Rect => {
  const { left, top, width, height } = props.style as Rect;
  return { left, top, width, height };
};

describe('버튼 자리', () => {
  it('기준 화면에서 두 버튼을 덮는다', async () => {
    const { play, stop } = await buttons('ready');

    expect({ play: rect(play), stop: rect(stop) }).toEqual({
      play: { left: 119, top: 668, width: 64, height: 64 },
      stop: { left: 207, top: 668, width: 64, height: 64 },
    });
  });

  it('기준 화면에서 두 터치 영역 사이가 24 논리 픽셀이다', async () => {
    const { play, stop } = await buttons('ready');

    expect(rect(stop).left - (rect(play).left + rect(play).width)).toBe(24);
  });

  it.each([2, 4, 6])('도트 %i에서 두 버튼이 겹치지 않는다', async (dotSize) => {
    const { play, stop } = await buttons('ready', dotSize);

    expect(rect(play).left + rect(play).width).toBeLessThanOrEqual(rect(stop).left);
  });
});

describe('누르면 그쪽 조작을 넘긴다', () => {
  it('재생 버튼', async () => {
    const { play } = await buttons('ready');
    await fireEvent.press(play);

    expect(pressed).toEqual(['play']);
  });

  it('정지 버튼', async () => {
    const { stop } = await buttons('running');
    await fireEvent.press(stop);

    expect(pressed).toEqual(['stop']);
  });
});

describe('잠긴 버튼은 눌리지 않는다', () => {
  it('대기에서 정지', async () => {
    const { stop } = await buttons('ready');
    await fireEvent.press(stop);

    expect(pressed).toEqual([]);
  });

  it('완료에서 재생', async () => {
    const { play } = await buttons('done');
    await fireEvent.press(play);

    expect(pressed).toEqual([]);
  });
});
