type GridPlacement = {
  /** 스프라이트 중심 (px) */
  centerX: number;
  centerY: number;
  widthInDots: number;
  heightInDots: number;
  /** 배율 1에서 도트 한 변 (px) */
  dotSize: number;
};

/**
 * 스프라이트를 놓을 왼쪽 위 모서리를 도트 단위로 구한다.
 * 중심을 반올림하면 원의 60등분이 어긋나므로 모서리에서만 격자에 맞춘다. `DESIGN.md` §5
 */
export const topLeftOnGrid = ({ centerX, centerY, widthInDots, heightInDots, dotSize }: GridPlacement) => {
  return {
    left: Math.round(centerX / dotSize - widthInDots / 2),
    top: Math.round(centerY / dotSize - heightInDots / 2),
  };
};
