import { describe, expect, it } from '@jest/globals';

import { controlsState } from './state';

import { type TimerPhase } from '@/entities/timer';

describe('단계에 따른 조작 버튼', () => {
  it.each<{ phase: TimerPhase; playIcon: string; playEnabled: boolean; stopEnabled: boolean }>([
    { phase: 'ready', playIcon: 'play', playEnabled: true, stopEnabled: false },
    { phase: 'running', playIcon: 'pause', playEnabled: true, stopEnabled: true },
    { phase: 'paused', playIcon: 'play', playEnabled: true, stopEnabled: true },
    { phase: 'completed', playIcon: 'play', playEnabled: false, stopEnabled: true },
  ])('$phase에서 아이콘 $playIcon, 재생 $playEnabled, 정지 $stopEnabled', ({ phase, playIcon, playEnabled, stopEnabled }) => {
    expect(controlsState(phase)).toEqual({ playIcon, playEnabled, stopEnabled });
  });
});
