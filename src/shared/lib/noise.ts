/**
 * [0, 1) 결정적 의사 난수. 같은 입력에 같은 값
 *
 * @param x - 첫 번째 시드
 * @param y - 두 번째 시드
 * @returns 0 이상 1 미만
 */
export const noise = (x: number, y: number): number => {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
};
