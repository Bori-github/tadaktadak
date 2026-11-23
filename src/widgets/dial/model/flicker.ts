import { useEffect, useState } from 'react';

/** 불꽃 A와 B를 번갈아 그리는 주기 (밀리초). `DESIGN.md` §9 */
const FLICKER_MS = 125;

/**
 * 불꽃 프레임 순서. `DESIGN.md` §8 층별 동작
 *
 * @param isFlickering - 불꽃이 도는지 여부. 일시정지이거나 붙은 눈금이 없으면 `false`
 * @param [intervalMs=FLICKER_MS] - 증가 주기 (밀리초)
 * @returns `intervalMs`마다 1 증가하는 값. 눈금별 프레임 위상 계산에 사용. 멈추면 값이 유지됨
 */
export const useFlickerStep = (isFlickering: boolean, intervalMs = FLICKER_MS): number => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isFlickering) return;

    // 0 초기화 시 눈금별 프레임 위상이 바뀌므로 정지 시 값 유지 후 이어서 증가
    const ticking = setInterval(() => setStep((current) => current + 1), intervalMs);
    return () => clearInterval(ticking);
  }, [isFlickering, intervalMs]);

  return step;
};
