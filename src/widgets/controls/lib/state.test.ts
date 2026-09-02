import { describe, expect, it } from '@jest/globals';

import { controlsState } from './state';

import { type TimerPhase } from '@/entities/timer';

describe('단계에 따른 조작 버튼', () => {
  it.each<{ phase: TimerPhase; playIcon: string; stopEnabled: boolean }>([
    { phase: 'ready', playIcon: 'play', stopEnabled: false },
    { phase: 'running', playIcon: 'pause', stopEnabled: true },
    { phase: 'paused', playIcon: 'play', stopEnabled: true },
    { phase: 'completed', playIcon: 'play', stopEnabled: true },
  ])('$phase에서 아이콘 $playIcon, 정지 $stopEnabled', ({ phase, playIcon, stopEnabled }) => {
    expect(controlsState(phase)).toEqual({ playIcon, stopEnabled });
  });
});
