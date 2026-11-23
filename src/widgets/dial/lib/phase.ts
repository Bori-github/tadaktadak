/**
 * 눈금별 프레임 위상. `step` 1 증가 시 위상 패턴이 시계 방향으로 1 눈금 이동
 *
 * @param step - `useFlickerStep` 값
 * @param tick - 시계판 눈금 번호. 12시 다음이 1
 * @param count - 위상 수
 * @returns 0 이상 `count` 미만
 */
export const clockwisePhase = (step: number, tick: number, count: number): number => (((step - tick) % count) + count) % count;
