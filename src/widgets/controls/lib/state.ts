import { type TimerPhase } from '@/entities/timer';
import { PAUSE_ICON, PLAY_ICON, type GridIcon } from '@/shared/ui/dot-icon';

/**
 * 타이머 단계에 따른 조작 버튼 상태
 *
 * @param phase - 타이머 단계
 * @returns 재생 버튼 아이콘 격자와 정지 버튼 잠금 여부
 */
export const controlsState = (phase: TimerPhase): { playIcon: GridIcon; stopEnabled: boolean } => ({
  playIcon: phase === 'running' ? PAUSE_ICON : PLAY_ICON,
  stopEnabled: phase !== 'ready',
});
