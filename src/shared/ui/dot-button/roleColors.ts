import { COLORS } from '@/shared/constants';

import { type DotRole } from './circle';

export const ROLE_COLORS: Record<DotRole, string> = {
  edge: COLORS.button.edge,
  face: COLORS.button.face,
  highlight: COLORS.button.highlight,
  shadow: COLORS.button.shadow,
};

export const DISABLED_ROLE_COLORS: Record<DotRole, string> = {
  edge: COLORS.button.lockedEdge,
  face: COLORS.button.lockedFace,
  highlight: COLORS.button.lockedFace,
  shadow: COLORS.button.lockedShadow,
};
