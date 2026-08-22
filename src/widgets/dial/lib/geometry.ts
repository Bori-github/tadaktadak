/** 시계판 위 한 점. `degrees`는 12시가 0, 3시가 90, 6시가 180이다 */
export const pointOnDial = (centerX: number, centerY: number, radius: number, degrees: number) => {
  // cos·sin에서 0도는 3시 방향을 가리키므로 보정한다
  const angle = ((degrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
};

type MinutesInput = {
  centerX: number;
  centerY: number;
  x: number;
  y: number;
  /** 직전 프레임의 분. 12시를 넘겼는지 가르는 기준 */
  previous: number;
  min: number;
  max: number;
};

/** 시계판 위 한 점이 가리키는 분. `DESIGN.md` §8 */
export const minutesFromPoint = ({ centerX, centerY, x, y, previous, min, max }: MinutesInput) => {
  'worklet';
  // atan2는 −180~180을 주므로 360을 더해 보정
  const degrees = ((((Math.atan2(y - centerY, x - centerX) * 180) / Math.PI + 90) % 360) + 360) % 360;
  const minutes = Math.round(degrees / 6);

  // 한 프레임에 30분 넘게 건너뛰었으면 12시를 넘긴 것
  if (minutes - previous > 30) return min;
  if (previous - minutes > 30) return max;

  return Math.min(max, Math.max(min, minutes));
};
