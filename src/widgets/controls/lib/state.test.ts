import { describe, expect, it } from '@jest/globals';

import { playIcon } from './state';

import { type TimerPhase } from '@/entities/timer';
import { PAUSE_ICON, PLAY_ICON, type GridIcon } from '@/shared/ui/dot-icon';

describe('타이머 단계에 따른 재생/일시정지 버튼 아이콘', () => {
  it.each<{ label: string; phase: TimerPhase; name: string; icon: GridIcon }>([
    { label: '대기', phase: 'ready', name: '재생', icon: PLAY_ICON },
    { label: '진행', phase: 'running', name: '일시정지', icon: PAUSE_ICON },
    { label: '일시정지', phase: 'paused', name: '재생', icon: PLAY_ICON },
    { label: '완료', phase: 'completed', name: '재생', icon: PLAY_ICON },
  ])('$label 단계에서는 $name 아이콘이다', ({ phase, icon }) => {
    expect(playIcon(phase)).toBe(icon);
  });
});
