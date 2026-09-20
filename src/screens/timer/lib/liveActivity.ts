import { type LiveActivityContent } from '@modules/live-activity';

import { MINUTE_IN_MS, type TimerMode, type TimerSession } from '@/entities/timer';
import { type Language } from '@/entities/language';

type ActivityContentParams = {
  session: TimerSession;
  settingMinutes: Record<TimerMode, number>;
  language: Language;
  now: number;
};

/**
 * 잠금화면에 표시할 내용.`SPEC.md` 상태 전이 시 처리
 *
 * @param params.session - 타이머 세션 값
 * @param params.settingMinutes - 집중/휴식 타이머 설정 시간(분)
 * @param params.language - 언어
 * @param params.now - 지금 시각 (밀리초)
 * @returns 잠금화면에 표시할 내용. 진행이 아니거나 끝날 시각이 지났으면 `null`
 */
export const activityContent = ({ session, settingMinutes, language, now }: ActivityContentParams): LiveActivityContent | null => {
  if (session.phase !== 'running') return null;

  // 끝날 시각이 지난 뒤에는 Live Activity에 `0:00`만 표시되므로 시작하지 않음
  if (session.endsAt <= now) return null;

  return {
    mode: session.mode,
    // `resumeTimer`가 `startedAt`에 최초 시작 시각을 남겨, 일시정지한 시간을 빼려고 끝날 시각에서 역산
    progressStartsAt: session.endsAt - settingMinutes[session.mode] * MINUTE_IN_MS,
    endsAt: session.endsAt,
    language,
  };
};
