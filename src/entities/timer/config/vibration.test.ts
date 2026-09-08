import { describe, expect, it } from '@jest/globals';

import { TIMER_MODES, type TimerMode } from '../model/mode';
import { COMPLETION_PATTERN } from './vibration';

const transientsOf = (mode: TimerMode) => COMPLETION_PATTERN[mode].filter((event) => event.type === 'transient');

const outOfRangeOf = (mode: TimerMode) => COMPLETION_PATTERN[mode].filter((event) => event.intensity < 0 || event.intensity > 1 || event.sharpness < 0 || event.sharpness > 1);

describe('완료 진동 패턴', () => {
  it('집중 패턴은 뚝뚝 끊기는 진동 세 번으로 구성된다', () => {
    expect(transientsOf('focus')).toHaveLength(3);
  });

  it('휴식 패턴은 하나의 진동이 연속으로 이어지는 진동으로 구성된다', () => {
    expect(COMPLETION_PATTERN.rest).toEqual([expect.objectContaining({ type: 'continuous' })]);
  });

  it.each(TIMER_MODES)('%s 패턴에 세기와 날카로움이 0에서 1을 벗어난 이벤트가 없다', (mode) => {
    expect(outOfRangeOf(mode)).toEqual([]);
  });
});
