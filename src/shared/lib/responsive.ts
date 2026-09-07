import { BUTTON_SIZE_IN_DOTS, DOT_SIZE, MEDIUM_MIN_SHORT_SIDE, MIN_SHORT_SIDE, ROUND_BUTTON_DIAMETER_IN_DOTS } from '@/shared/constants';

const MAX_SCALE = 3;

const EDGE_MARGIN = 8;
const NUMERAL_MARGIN = 20;
const MAX_ITEM_RADIUS = 153;

const NUMERAL_GAP = 6;
const NUMERAL_HALF_HEIGHT = 7;
const ARC_GAP = 13;

const BUTTON_OFFSET_FROM_SAFE_AREA = 150;
const BUTTON_BOTTOM_MARGIN_MIN = 16;
const DIAL_TO_BUTTON_GAP = 90;

type LayoutInput = {
  shortSide: number;
  safeAreaTopEdge: number;
  safeAreaBottomEdge: number;
};

type Layout = {
  scale: number;
  dotSize: number;
  /** compact 등급 여부. `DESIGN.md` §7 구간별 처리 */
  isCompact: boolean;
  itemRadius: number;
  arcRadius: number;
  numeralRadius: number;
  buttonCenterY: number;
  dialCenterY: number;
  /** 알림 설정 버튼 중심 (px). `DESIGN.md` §5 배치 순서 */
  notificationSettingsCenterX: number;
  notificationSettingsCenterY: number;
};

// TODO: isCompact 대신 등급 반환
export const resolveLayout = ({ shortSide, safeAreaTopEdge, safeAreaBottomEdge }: LayoutInput): Layout => {
  const scale = Math.min(MAX_SCALE, Math.max(1, Math.floor(shortSide / MIN_SHORT_SIDE)));
  const width = shortSide / scale;

  const isCompact = shortSide < MEDIUM_MIN_SHORT_SIDE;
  const bonfireDots = isCompact ? 7 : 9;
  const bonfireHalfHeight = (bonfireDots * DOT_SIZE) / 2;

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

  // 세로 전용이라 짧은 변이 곧 화면 너비
  const notificationSettingsSize = ROUND_BUTTON_DIAMETER_IN_DOTS * DOT_SIZE * scale;
  // 가장자리 여백은 배율 1 기준 값이라 시계판과 같이 배율을 곱함
  const notificationSettingsMargin = EDGE_MARGIN * scale;

  return {
    scale,
    dotSize: DOT_SIZE * scale,
    isCompact,
    itemRadius: itemRadius * scale,
    arcRadius: arcRadius * scale,
    numeralRadius: numeralRadius * scale,
    buttonCenterY,
    dialCenterY: buttonCenterY - dialToButton,
    notificationSettingsCenterX: shortSide - notificationSettingsMargin - notificationSettingsSize / 2,
    notificationSettingsCenterY: safeAreaTopEdge + notificationSettingsMargin + notificationSettingsSize / 2,
  };
};
