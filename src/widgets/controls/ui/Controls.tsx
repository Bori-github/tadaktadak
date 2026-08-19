import { DotButton } from '@/shared/ui/dot-button';

/** 두 버튼 중심 간격 (dot). `DESIGN.md` §5 기준 화면에서 88px */
const GAP_IN_DOTS = 44;

type ControlsProps = {
  centerX: number;
  centerY: number;
  dotSize: number;
};

export const Controls = ({ centerX, centerY, dotSize }: ControlsProps) => {
  const offset = (GAP_IN_DOTS / 2) * dotSize;

  return (
    <>
      <DotButton centerX={centerX - offset} centerY={centerY} dotSize={dotSize} icon="play" />
      <DotButton centerX={centerX + offset} centerY={centerY} dotSize={dotSize} icon="stop" enabled={false} />
    </>
  );
};
