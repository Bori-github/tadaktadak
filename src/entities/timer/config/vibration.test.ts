import { describe, expect, it } from '@jest/globals';

import { COMPLETION_PATTERN } from './vibration';

const hasTransient = (mode: 'focus' | 'rest') => COMPLETION_PATTERN[mode].some((event) => event.type === 'transient');

describe('완료 진동 패턴', () => {
  it('집중 패턴은 뚝뚝 끊기는 진동으로 구성된다', () => {
    expect(hasTransient('focus')).toBe(true);
  });

  it('휴식 패턴은 하나의 진동이 연속으로 이어지는 진동으로 구성된다', () => {
    expect(hasTransient('rest')).toBe(false);
  });
});
