import { useEffect, useState } from 'react';

/** 불꽃 A와 B를 번갈아 그리는 주기 (밀리초). `DESIGN.md` §9 */
const FLICKER_MS = 125;

/**
 * 불꽃 프레임 순서. `DESIGN.md` §8 층별 동작
 *
 * @param isFlickering - 불꽃이 도는지 여부. 일시정지이거나 붙은 눈금이 없으면 `false`
 * @returns 125밀리초마다 1씩 느는 값. 홀짝이 A와 B를 정함. 멈추면 값이 유지됨
 */
export const useFlickerStep = (isFlickering: boolean): number => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isFlickering) return;

    // 0으로 되돌리면 홀짝이 뒤집혀 타던 눈금의 프레임이 바뀌므로, 이어서 세고 멈출 때 값을 유지함
    const ticking = setInterval(() => setStep((current) => current + 1), FLICKER_MS);
    return () => clearInterval(ticking);
  }, [isFlickering]);

  return step;
};
