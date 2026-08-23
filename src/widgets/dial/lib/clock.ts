/**
 * 초를 mm:ss 형태 문자열로 변환
 *
 * @param seconds - 남은 시간(초)
 * @returns mm:ss 형태 문자열. 60초 이상은 시로 넘기지 않음 (3600초는 `60:00`)
 */
export const formatSecondsToClock = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};
