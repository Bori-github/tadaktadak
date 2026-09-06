import { describe, expect, it } from '@jest/globals';

import { controlsState } from './state';

import { type TimerPhase } from '@/entities/timer';
import { PAUSE_ICON, PLAY_ICON, type GridIcon } from '@/shared/ui/dot-button';

describe('단계에 따른 조작 버튼', () => {
  it.each<{ phase: TimerPhase; icon: string; playIcon: GridIcon; stopEnabled: boolean }>([
    { phase: 'ready', icon: '재생', playIcon: PLAY_ICON, stopEnabled: false },
    { phase: 'running', icon: '일시정지', playIcon: PAUSE_ICON, stopEnabled: true },
    { phase: 'paused', icon: '재생', playIcon: PLAY_ICON, stopEnabled: true },
    { phase: 'completed', icon: '재생', playIcon: PLAY_ICON, stopEnabled: true },
  ])('$phase에서 아이콘 $icon, 정지 $stopEnabled', ({ phase, playIcon, stopEnabled }) => {
    expect(controlsState(phase)).toEqual({ playIcon, stopEnabled });
  });
});
