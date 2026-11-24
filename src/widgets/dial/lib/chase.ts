/** 최대 밝기 전구 위치의 순환 주기 (밀리초) */
const CHASE_PERIOD_MS = 1750;

/** 최대 밝기 전구 뒤 밝기 감소 구간 (전구 수) */
const CHASE_FADE_COUNT = 6;

type ChaseInput = {
  tick: number;
  elapsedMs: number;
  settingMinutes: number;
};

/**
 * 완료 연출 중 전구별 추가 밝기. 최대 밝기 전구 위치는 12시부터 시계 방향으로 순환
 *
 * @param input.tick - 시계판 눈금 번호. 12시 다음이 1
 * @param input.elapsedMs - 완료 연출 시작 후 경과 시간 (밀리초)
 * @param input.settingMinutes - 순환 대상 전구 수
 * @returns 최대 밝기 위치 1, 뒤쪽 전구 6개에 걸쳐 선형 감소, 그 밖 0
 */
export const chaseBoost = ({ tick, elapsedMs, settingMinutes }: ChaseInput): number => {
  'worklet';
  const peak = ((elapsedMs / CHASE_PERIOD_MS) * settingMinutes) % settingMinutes;
  const behind = (peak - (tick - 1) + settingMinutes) % settingMinutes;

  return behind < CHASE_FADE_COUNT ? 1 - behind / CHASE_FADE_COUNT : 0;
};
