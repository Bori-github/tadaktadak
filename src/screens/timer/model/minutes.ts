import { useCallback, useEffect, useState } from 'react';

import { loadMinutes, saveMinutes, TIMER_DEFAULT, type TimerMode } from '@/entities/timer';

interface StoredMinutes {
  minutes: Record<TimerMode, number>;
  changeMinutes: (mode: TimerMode, value: number) => void;
  storeMinutes: (mode: TimerMode, value: number) => void;
}

/**
 * 기기에 남는 타이머 시간(분). `SPEC.md` 기기에 저장하는 값
 *
 * @returns 집중과 휴식의 타이머 시간(분), 화면에 반영하는 조작, 기기에 남기는 조작
 */
export const useStoredMinutes = (): StoredMinutes => {
  const [minutes, setMinutes] = useState(TIMER_DEFAULT);

  useEffect(() => {
    // 실패하면 기본값으로 시작함
    loadMinutes()
      .then((stored) => setMinutes(stored))
      .catch(() => {});
  }, []);

  const changeMinutes = useCallback((mode: TimerMode, value: number) => {
    setMinutes((previous) => ({ ...previous, [mode]: value }));
  }, []);

  // 스냅마다 기기에 쓰지 않으려고 끌기가 끝날 때만 부름
  const storeMinutes = useCallback((mode: TimerMode, value: number) => {
    // 실패하면 다음 실행에서 이전 타이머 시간으로 시작함
    saveMinutes(mode, value).catch(() => {});
  }, []);

  return { minutes, changeMinutes, storeMinutes };
};
