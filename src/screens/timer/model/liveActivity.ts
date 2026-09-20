import { useEffect } from 'react';

import { liveActivity } from '@modules/live-activity';

import { activityContent } from '../lib/liveActivity';

import { type TimerMode, type TimerSession } from '@/entities/timer';
import { useLanguage } from '@/entities/language';

type LiveActivityParams = {
  session: TimerSession;
  settingMinutes: Record<TimerMode, number>;
  isSettled: boolean;
};

/**
 * `SPEC.md` 상태 전이 시 처리
 *
 * @param params.session - 타이머 세션 값
 * @param params.settingMinutes - 집중/휴식 타이머 설정 시간(분)
 * @param params.isSettled - 저장값 읽기 완료 여부
 * @returns 없음
 */
export const useLiveActivity = ({ session, settingMinutes, isSettled }: LiveActivityParams): void => {
  const language = useLanguage();

  useEffect(() => {
    const bridge = liveActivity;

    // 저장값을 읽기 전에는 세션 값이 대기라, 진행 중에 종료됐던 Live Activity를 지우게 되므로 멈춤
    if (!isSettled || bridge === null) return;

    const content = activityContent({ session, settingMinutes, language, now: Date.now() });

    // 따로 호출하면 늦게 도착한 종료가 방금 시작한 Live Activity를 지우므로, 한 함수에서 이어 실행
    const apply = async (): Promise<void> => {
      if (content === null) await bridge.endAsync();
      else await bridge.startAsync(content);
    };

    // 실패해도 타이머는 그대로 진행. 잠금화면에만 표시되지 않음
    apply().catch(() => {});

    // 앱이 백그라운드로 가거나 닫혀도 남은 시간이 이어져야 해서 화면이 사라질 때 끝내지 않음
  }, [session, settingMinutes, isSettled, language]);
};
