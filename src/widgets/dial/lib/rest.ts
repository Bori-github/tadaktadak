type RestDialInput = {
  focusMinutes: number;
  restMinutes: number;
  remainingMinutes: number;
};

/**
 * 휴식 타이머가 진행되는 동안 호와 손잡이가 가리킬 시간(분). `DESIGN.md` §8 휴식 타이머
 *
 * @param input.focusMinutes - 설정한 집중 타이머 시간(분)
 * @param input.restMinutes - 설정한 휴식 타이머 시간(분)
 * @param input.remainingMinutes - 휴식에 남은 시간(분)
 * @returns 0에서 집중 타이머 설정 시간 사이의 시간. 휴식이 흐른 비율만큼 커짐
 */
export const restDialMinutes = ({ focusMinutes, restMinutes, remainingMinutes }: RestDialInput): number => {
  'worklet';
  if (restMinutes <= 0) return 0;

  const elapsed = Math.min(1, Math.max(0, 1 - remainingMinutes / restMinutes));

  return focusMinutes * elapsed;
};
