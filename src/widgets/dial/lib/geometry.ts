/** 시계판 위 한 점. `degrees`는 12시가 0, 3시가 90, 6시가 180이다 */
export const pointOnDial = (centerX: number, centerY: number, radius: number, degrees: number) => {
  // cos·sin에서 0도는 3시 방향을 가리키므로 보정한다
  const angle = ((degrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
};
