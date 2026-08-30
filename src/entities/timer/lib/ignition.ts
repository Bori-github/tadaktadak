type IgnitionInput = {
  tick: number;
  remainingMinutes: number;
  settingMinutes: number;
};

/**
 * 시계판 눈금 하나에 불이 붙은 정도. `DESIGN.md` §8 점화 판정
 *
 * @param input.tick - 시계판 눈금 번호. 12시 다음이 1
 * @param input.remainingMinutes - 남은 시간 (분). 소수
 * @param input.settingMinutes - 설정한 타이머 시간 (분)
 * @returns 0은 꺼진 상태, 1은 다 붙은 상태인 진행률
 */
export const ignitionProgress = ({ tick, remainingMinutes, settingMinutes }: IgnitionInput): number => {
  'worklet';
  // 설정 밖 눈금은 불이 붙지 않은 상태. `DESIGN.md` §5
  if (tick > settingMinutes) return 0;

  if (tick - 1 >= remainingMinutes) return 1;
  if (tick > remainingMinutes) return tick - remainingMinutes;

  return 0;
};
