import { COLORS } from '@/shared/constants';

import { type DotRole } from '@/shared/ui/dot-shape';

const ROLE_COLORS: Record<DotRole, string> = {
  edge: COLORS.button.edge,
  face: COLORS.button.face,
  highlight: COLORS.button.highlight,
  shadow: COLORS.button.shadow,
};

const DISABLED_ROLE_COLORS: Record<DotRole, string> = {
  edge: COLORS.button.disabledEdge,
  face: COLORS.button.disabledFace,
  highlight: COLORS.button.disabledFace,
  shadow: COLORS.button.disabledShadow,
};

type ButtonState = {
  disabled: boolean;
  active: boolean;
};

/**
 * 버튼 상태에 맞는 역할별 색. active 상태는 하이라이트를 면 색으로 변경
 *
 * @returns 역할별 색
 */
export const getRoleColors = ({ disabled, active }: ButtonState): Record<DotRole, string> => {
  const colors = disabled ? DISABLED_ROLE_COLORS : ROLE_COLORS;

  return active ? { ...colors, highlight: colors.face } : colors;
};
