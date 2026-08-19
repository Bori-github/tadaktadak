import { BONFIRE_TALL_WIDTH, DOT_SIZE, MIN_WIDTH } from '@/shared/constants';

const EDGE_MARGIN = 8;
const TICK_NUMBER_MARGIN = 20;
const MAX_ITEM_RADIUS = 153;

const TICK_NUMBER_GAP = 6;
const TICK_NUMBER_HALF_HEIGHT = 7;
const ARC_GAP = 13;

const BUTTON_OFFSET_FROM_SAFE_AREA = 150;
const BUTTON_OFFSET_MIN = 44;
const DIAL_OFFSET_FROM_BUTTON = 300;

type LayoutInput = {
  shortSide: number;
  safeAreaTopEdge: number;
  safeAreaBottomEdge: number;
};

type Layout = {
  scale: number;
  dotSize: number;
  bonfireDots: number;
  itemRadius: number;
  arcRadius: number;
  tickNumberRadius: number;
  buttonCenterY: number;
  dialCenterY: number;
};

export function resolveLayout({ shortSide, safeAreaTopEdge, safeAreaBottomEdge }: LayoutInput): Layout {
  const scale = Math.max(1, Math.floor(shortSide / MIN_WIDTH));
  const width = shortSide / scale;

  const bonfireDots = shortSide < BONFIRE_TALL_WIDTH ? 7 : 9;
  const bonfireHalfHeight = (bonfireDots * DOT_SIZE) / 2;

  const itemRadius = Math.min(width / 2 - EDGE_MARGIN - TICK_NUMBER_MARGIN - bonfireHalfHeight, MAX_ITEM_RADIUS);
  const arcRadius = itemRadius - bonfireHalfHeight - ARC_GAP;
  const tickNumberRadius = itemRadius + bonfireHalfHeight + TICK_NUMBER_GAP + TICK_NUMBER_HALF_HEIGHT;

  const dialTopHalfHeight = (tickNumberRadius + TICK_NUMBER_HALF_HEIGHT) * scale;
  const safeAreaHeight = safeAreaBottomEdge - safeAreaTopEdge;
  const roomAboveDial = safeAreaHeight - dialTopHalfHeight - DIAL_OFFSET_FROM_BUTTON;
  const buttonOffset = Math.min(BUTTON_OFFSET_FROM_SAFE_AREA, Math.max(BUTTON_OFFSET_MIN, roomAboveDial));
  const buttonCenterY = safeAreaBottomEdge - buttonOffset;

  return {
    scale,
    dotSize: DOT_SIZE * scale,
    bonfireDots,
    itemRadius: itemRadius * scale,
    arcRadius: arcRadius * scale,
    tickNumberRadius: tickNumberRadius * scale,
    buttonCenterY,
    dialCenterY: buttonCenterY - DIAL_OFFSET_FROM_BUTTON,
  };
}
