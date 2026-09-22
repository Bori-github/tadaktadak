import { COLORS } from '@/shared/constants';

import { type DotRole } from '@/shared/ui/dot-shape';

export const ROLE_COLORS: Record<DotRole, string> = {
  edge: COLORS.button.edge,
  face: COLORS.button.face,
  highlight: COLORS.button.highlight,
  shadow: COLORS.button.shadow,
};

export const DISABLED_ROLE_COLORS: Record<DotRole, string> = {
  edge: COLORS.button.disabledEdge,
  face: COLORS.button.disabledFace,
  highlight: COLORS.button.disabledFace,
  shadow: COLORS.button.disabledShadow,
};
