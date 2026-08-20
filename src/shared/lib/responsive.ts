import { BONFIRE_TALL_WIDTH, BUTTON_SIZE_IN_DOTS, DOT_SIZE, MIN_WIDTH } from '@/shared/constants';

const EDGE_MARGIN = 8;
const TICK_NUMBER_MARGIN = 20;
const MAX_ITEM_RADIUS = 153;

const TICK_NUMBER_GAP = 6;
const TICK_NUMBER_HALF_HEIGHT = 7;
const ARC_GAP = 13;

const BUTTON_OFFSET_FROM_SAFE_AREA = 150;
const BUTTON_OFFSET_MIN = 44;
const DIAL_TO_BUTTON_GAP = 90;

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

export const resolveLayout = ({ shortSide, safeAreaTopEdge, safeAreaBottomEdge }: LayoutInput): Layout => {
  const scale = Math.max(1, Math.floor(shortSide / MIN_WIDTH));
  const width = shortSide / scale;

  const bonfireDots = shortSide < BONFIRE_TALL_WIDTH ? 7 : 9;
  const bonfireHalfHeight = (bonfireDots * DOT_SIZE) / 2;

  const itemRadius = Math.min(width / 2 - EDGE_MARGIN - TICK_NUMBER_MARGIN - bonfireHalfHeight, MAX_ITEM_RADIUS);
  const arcRadius = itemRadius - bonfireHalfHeight - ARC_GAP;
  const tickNumberRadius = itemRadius + bonfireHalfHeight + TICK_NUMBER_GAP + TICK_NUMBER_HALF_HEIGHT;

  const dialTopHalfHeight = (tickNumberRadius + TICK_NUMBER_HALF_HEIGHT) * scale;
  const buttonHalfHeight = (BUTTON_SIZE_IN_DOTS / 2) * DOT_SIZE * scale;
  // 배율이 올라도 이 여백이 지켜지도록 거리를 늘린다. 배율 1에서 182 + 90 + 28 = 300
  const dialOffset = dialTopHalfHeight + DIAL_TO_BUTTON_GAP + buttonHalfHeight;

  const safeAreaHeight = safeAreaBottomEdge - safeAreaTopEdge;
  const roomAboveDial = safeAreaHeight - dialTopHalfHeight - dialOffset;
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
    dialCenterY: buttonCenterY - dialOffset,
  };
};
