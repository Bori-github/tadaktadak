import { describe, expect, it } from '@jest/globals';

import { controlsState } from './state';

import { type TimerPhase } from '@/entities/timer';

describe('단계에 따른 조작 버튼', () => {
  it.each([
    ['idle', 'play', true, false],
    ['running', 'pause', true, true],
    ['paused', 'play', true, true],
    ['done', 'play', false, true],
  ])('%s에서 아이콘 %s, 재생 %s, 정지 %s', (phase, playIcon, playEnabled, stopEnabled) => {
    expect(controlsState(phase as TimerPhase)).toEqual({ playIcon, playEnabled, stopEnabled });
  });
});
