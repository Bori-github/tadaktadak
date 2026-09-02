import { type TimerPhase } from '@/entities/timer';
import { type IconName } from '@/shared/ui/dot-button';

/**
 * 타이머 단계에 따른 조작 버튼 상태
 *
 * @param phase - 타이머 단계
 * @returns 재생 버튼 아이콘과 정지 버튼 잠금 여부
 */
export const controlsState = (phase: TimerPhase): { playIcon: IconName; stopEnabled: boolean } => ({
  playIcon: phase === 'running' ? 'pause' : 'play',
  stopEnabled: phase !== 'ready',
});
