type IgnitionInput = {
  slot: number;
  remainingMinutes: number;
  settingMinutes: number;
};

/**
 * 시계판 칸 하나에 불이 붙은 정도. `DESIGN.md` §8 점화 판정
 *
 * @param input.slot - 시계판 칸 번호. 12시 다음이 1
 * @param input.remainingMinutes - 남은 시간 (분). 소수
 * @param input.settingMinutes - 설정한 타이머 시간 (분)
 * @returns 0은 꺼진 상태, 1은 다 붙은 상태인 진행률
 */
export const ignitionProgress = ({ slot, remainingMinutes, settingMinutes }: IgnitionInput) => {
  'worklet';
  // 설정 밖 칸은 불이 붙지 않은 상태. `DESIGN.md` §6
  if (slot > settingMinutes) return 0;

  if (slot - 1 >= remainingMinutes) return 1;
  if (slot > remainingMinutes) return slot - remainingMinutes;

  return 0;
};
