import { type TimerSession } from './session';

/**
 * 기기에 저장할 타이머 세션 값 문자열. `SPEC.md` 기기에 저장하는 값
 *
 * @param session - 지금 타이머 세션 값
 * @returns 저장할 문자열. 지울 자리면 `null`
 */
export const serializeSession = (session: TimerSession): string | null => (session.phase === 'idle' ? null : JSON.stringify(session));
