import { describe, expect, it } from '@jest/globals';

import { isStopEnabled, playIcon } from './state';

import { type TimerPhase } from '@/entities/timer';
import { PAUSE_ICON, PLAY_ICON, type GridIcon } from '@/shared/ui/dot-icon';

describe('재생 버튼 아이콘', () => {
  it.each<{ phase: TimerPhase; name: string; icon: GridIcon }>([
    { phase: 'ready', name: '재생', icon: PLAY_ICON },
    { phase: 'running', name: '일시정지', icon: PAUSE_ICON },
    { phase: 'paused', name: '재생', icon: PLAY_ICON },
    { phase: 'completed', name: '재생', icon: PLAY_ICON },
  ])('$phase에서 $name', ({ phase, icon }) => {
    expect(playIcon(phase)).toBe(icon);
  });
});

describe('정지 버튼 잠금', () => {
  it.each<{ phase: TimerPhase; enabled: boolean }>([
    { phase: 'ready', enabled: false },
    { phase: 'running', enabled: true },
    { phase: 'paused', enabled: true },
    { phase: 'completed', enabled: true },
  ])('$phase에서 $enabled', ({ phase, enabled }) => {
    expect(isStopEnabled(phase)).toBe(enabled);
  });
});
