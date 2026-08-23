type RemainingInput = {
  remainingAtStartMs: number;
  startedAtUptime: number;
  nowUptime: number;
};

/**
 * 진행 중 남은 시간. `SPEC.md` 남은 시간
 *
 * @param input.remainingAtStartMs - 시작 또는 재개 시점에 남아 있던 시간 (밀리초). 시작은 설정 시간, 재개는 일시정지 시 남은 밀리초
 * @param input.startedAtUptime - 시작 또는 재개한 기기 가동 시간 (밀리초)
 * @param input.nowUptime - 지금 기기 가동 시간 (밀리초)
 * @returns 0이 하한인 남은 밀리초
 */
export const remainingMs = ({ remainingAtStartMs, startedAtUptime, nowUptime }: RemainingInput) => {
  'worklet';
  return Math.max(0, remainingAtStartMs - (nowUptime - startedAtUptime));
};
