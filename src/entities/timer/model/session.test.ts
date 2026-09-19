import { describe, expect, it } from '@jest/globals';

import { isReadyPhase, type TimerPhase } from './session';

describe('대기 상태인지 여부', () => {
  it.each<{ label: string; phase: TimerPhase; ready: boolean }>([
    { label: '대기 상태', phase: 'ready', ready: true },
    { label: '진행 상태', phase: 'running', ready: false },
    { label: '일시정지 상태', phase: 'paused', ready: false },
    { label: '완료 상태', phase: 'completed', ready: false },
  ])('$label에서 대기 상태 여부는 $ready다', ({ phase, ready }) => {
    expect(isReadyPhase(phase)).toBe(ready);
  });
});
