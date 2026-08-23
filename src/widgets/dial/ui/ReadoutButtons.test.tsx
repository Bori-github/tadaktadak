import { describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ReadoutButtons } from './ReadoutButtons';

import { type TimerMode } from '@/entities/timer';

/** 기준 화면 iPhone 17e의 시계판 중심. `DESIGN.md` §5 */
const CENTER_X = 195;
const CENTER_Y = 360;

type Rect = { left: number; top: number; width: number; height: number };

const buttons = async (dotSize: number, onSelect: (target: TimerMode) => void = () => {}) => {
  await render(<ReadoutButtons centerX={CENTER_X} centerY={CENTER_Y} dotSize={dotSize} onSelect={onSelect} />);

  const [focus, rest] = screen.getAllByRole('button');
  if (!focus || !rest) throw new Error('버튼이 둘이 아니다');

  return { focus, rest };
};

const rects = async (dotSize: number) => {
  const { focus, rest } = await buttons(dotSize);
  const box = ({ props }: { props: Record<string, unknown> }) => {
    const { left, top, width, height } = props.style as Rect;
    return { left, top, width, height };
  };

  return { focus: box(focus), rest: box(rest) };
};

const press = async (target: TimerMode) => {
  const picked: TimerMode[] = [];
  const found = await buttons(2, (value) => picked.push(value));
  await fireEvent.press(found[target]);

  return picked;
};

describe('숫자 자리', () => {
  it('기준 화면에서 두 숫자를 덮는다', async () => {
    expect(await rects(2)).toEqual({
      focus: { left: 100, top: 331, width: 190, height: 58 },
      rest: { left: 158, top: 393, width: 74, height: 30 },
    });
  });

  it('배율 2에서 함께 커진다', async () => {
    expect((await rects(4)).focus).toEqual({ left: 13, top: 310, width: 364, height: 100 });
  });
});

describe('두 버튼이 겹치지 않는다', () => {
  it.each([2, 4, 6])('도트 %i', async (dotSize) => {
    const { focus, rest } = await rects(dotSize);
    expect(focus.top + focus.height).toBeLessThan(rest.top);
  });
});

describe('누르면 그쪽 이름을 넘긴다', () => {
  it('가운데 숫자는 집중이다', async () => {
    expect(await press('focus')).toEqual(['focus']);
  });

  it('아래 숫자는 휴식이다', async () => {
    expect(await press('rest')).toEqual(['rest']);
  });
});
