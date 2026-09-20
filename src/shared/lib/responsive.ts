import { BUTTON_SIZE_IN_DOTS, DOT_SIZE, SCREEN_GRADES, type ScreenGrade } from '@/shared/constants';

const EDGE_MARGIN = 8;
const NUMERAL_MARGIN = 20;
const MAX_ITEM_RADIUS = 153;

const NUMERAL_GAP = 6;
const NUMERAL_HALF_HEIGHT = 7;
const ARC_GAP = 13;

const BUTTON_OFFSET_FROM_SAFE_AREA = 150;
const BUTTON_BOTTOM_MARGIN_MIN = 16;
const DIAL_TO_BUTTON_GAP = 90;

const resolveScreenGrade = (shortSide: number): ScreenGrade => {
  if (shortSide >= SCREEN_GRADES.large.minShortSide) return 'large';
  if (shortSide >= SCREEN_GRADES.expanded.minShortSide) return 'expanded';
  if (shortSide >= SCREEN_GRADES.medium.minShortSide) return 'medium';
  return 'compact';
};

type LayoutInput = {
  shortSide: number;
  safeAreaTopEdge: number;
  safeAreaBottomEdge: number;
};

type Layout = {
  scale: number;
  dotSize: number;
  /** 화면 가장자리 여백 (px). `DESIGN.md` §5 배치 순서 */
  edgeMargin: number;
  screenGrade: ScreenGrade;
  itemRadius: number;
  arcRadius: number;
  numeralRadius: number;
  buttonCenterY: number;
  dialCenterY: number;
};

export const resolveLayout = ({ shortSide, safeAreaTopEdge, safeAreaBottomEdge }: LayoutInput): Layout => {
  const screenGrade = resolveScreenGrade(shortSide);
  const { scale, bonfireHeightInDots } = SCREEN_GRADES[screenGrade];
  const width = shortSide / scale;

  const bonfireHalfHeight = (bonfireHeightInDots * DOT_SIZE) / 2;

  const itemRadius = Math.min(width / 2 - EDGE_MARGIN - NUMERAL_MARGIN - bonfireHalfHeight, MAX_ITEM_RADIUS);
  const arcRadius = itemRadius - bonfireHalfHeight - ARC_GAP;
  const numeralRadius = itemRadius + bonfireHalfHeight + NUMERAL_GAP + NUMERAL_HALF_HEIGHT;

  const dialTopHalfHeight = (numeralRadius + NUMERAL_HALF_HEIGHT) * scale;
  const buttonHalfHeight = (BUTTON_SIZE_IN_DOTS / 2) * DOT_SIZE * scale;
  // 배율이 달라져도 시계판-버튼 여백 90px 유지. 배율 1에서 182 + 90 + 28 = 300px
  const dialToButton = dialTopHalfHeight + DIAL_TO_BUTTON_GAP + buttonHalfHeight;
  // 시계판 위 끝부터 버튼 중심까지
  const stackHeight = dialTopHalfHeight + dialToButton;

  const safeAreaHeight = safeAreaBottomEdge - safeAreaTopEdge;
  // 배율이 달라져도 버튼 아래 여백 16px 유지. 배율 1에서 28 + 16 = 44px
  const buttonOffsetMin = buttonHalfHeight + BUTTON_BOTTOM_MARGIN_MIN;
  const buttonOffset = Math.min(BUTTON_OFFSET_FROM_SAFE_AREA, Math.max(buttonOffsetMin, safeAreaHeight - stackHeight));
  const buttonCenterY = safeAreaBottomEdge - buttonOffset;

  return {
    scale,
    dotSize: DOT_SIZE * scale,
    edgeMargin: EDGE_MARGIN * scale,
    screenGrade,
    itemRadius: itemRadius * scale,
    arcRadius: arcRadius * scale,
    numeralRadius: numeralRadius * scale,
    buttonCenterY,
    dialCenterY: buttonCenterY - dialToButton,
  };
};
