import { type TimerPhase } from '@/entities/timer';
import { PAUSE_ICON, PLAY_ICON, type GridIcon } from '@/shared/ui/dot-icon';

/**
 * 타이머 단계에 따른 재생/일시정지 버튼 아이콘
 *
 * @param phase - 타이머 단계
 * @returns 진행 중이면 일시정지, 아니면 재생
 */
export const playIcon = (phase: TimerPhase): GridIcon => (phase === 'running' ? PAUSE_ICON : PLAY_ICON);

/**
 * 타이머 단계에 따른 정지 버튼 잠금
 *
 * 그림과 터치가 같은 답을 봐야 함. 어긋나면 잠겨 보이는 버튼이 눌림
 *
 * @param phase - 타이머 단계
 * @returns 대기가 아니면 true
 */
export const isStopEnabled = (phase: TimerPhase): boolean => phase !== 'ready';
