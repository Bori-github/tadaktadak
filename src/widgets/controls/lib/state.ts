import { type TimerPhase } from '@/entities/timer';
import { PAUSE_ICON, PLAY_ICON, type GridIcon } from '@/shared/ui/dot-icon';

/**
 * 타이머 단계에 따른 재생/일시정지 버튼 아이콘
 *
 * @param phase - 타이머 단계
 * @returns 진행 중이면 일시정지, 아니면 재생
 */
export const playIcon = (phase: TimerPhase): GridIcon => (phase === 'running' ? PAUSE_ICON : PLAY_ICON);
