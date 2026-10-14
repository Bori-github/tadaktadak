import { describe, expect, it } from '@jest/globals';

import { isReadyPhase, type TimerPhase } from './session';

describe('대기 상태인지 여부', () => {
  it.each<{ label: string; phase: TimerPhase; ready: boolean; result: string }>([
    { label: '대기 상태', phase: 'ready', ready: true, result: '대기 상태다' },
    { label: '진행 상태', phase: 'running', ready: false, result: '대기 상태가 아니다' },
    { label: '일시정지 상태', phase: 'paused', ready: false, result: '대기 상태가 아니다' },
    { label: '완료 상태', phase: 'completed', ready: false, result: '대기 상태가 아니다' },
  ])('$label는 $result', ({ phase, ready }) => {
    expect(isReadyPhase(phase)).toBe(ready);
  });
});
