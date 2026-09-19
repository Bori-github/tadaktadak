import { describe, expect, it } from '@jest/globals';

import { isSettingsDisabled } from './settings';

import { type TimerPhase } from '@/entities/timer';

describe('타이머 단계에 따른 설정 버튼 disabled 상태', () => {
  it.each<{ label: string; phase: TimerPhase; disabled: boolean }>([
    { label: '대기 상태', phase: 'ready', disabled: false },
    { label: '진행 상태', phase: 'running', disabled: true },
    { label: '일시정지 상태', phase: 'paused', disabled: true },
    { label: '완료 상태', phase: 'completed', disabled: true },
  ])('$label에서 설정 버튼 disabled 상태는 $disabled다', ({ phase, disabled }) => {
    expect(isSettingsDisabled(phase)).toBe(disabled);
  });
});
