import { type TimerPhase } from '@/entities/timer';

/**
 * 타이머 단계에 따른 설정 버튼 disabled 상태. `DESIGN.md` §8 조작
 *
 * @param phase - 타이머 단계
 * @returns 대기 상태가 아니면 `true`
 */
export const isSettingsDisabled = (phase: TimerPhase): boolean => phase !== 'ready';
