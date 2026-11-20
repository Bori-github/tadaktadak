import { type Palette } from '@/shared/lib';
import { type DotRole } from '@/shared/ui/dot-shape';

type ButtonState = {
  button: Palette['button'];
  disabled: boolean;
  active: boolean;
};

/**
 * 버튼 상태에 맞는 역할별 색. active 상태는 하이라이트를 면 색으로 변경
 *
 * @returns 역할별 색
 */
export const getRoleColors = ({ button, disabled, active }: ButtonState): Record<DotRole, string> => {
  const colors: Record<DotRole, string> = disabled
    ? { edge: button.disabledEdge, face: button.disabledFace, highlight: button.disabledFace, shadow: button.disabledShadow }
    : { edge: button.edge, face: button.face, highlight: button.highlight, shadow: button.shadow };

  return active ? { ...colors, highlight: colors.face } : colors;
};
