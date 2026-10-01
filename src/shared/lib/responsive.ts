import { BUTTON_SIZE_IN_DOTS, DOT_SIZE, SCREEN_GRADES, type BonfireHeightInDots, type ScreenGrade } from '@/shared/constants';

const EDGE_MARGIN = 8;
/** 시계판 바깥과 safe area 경계 사이 최소 간격 (px). 배율을 곱하지 않음 */
const DIAL_SAFE_AREA_MARGIN = 8;

const REFERENCE_SHORT_SIDE = 390;
const REFERENCE_ITEM_RADIUS = 153;
const MAX_SHORT_SIDE = REFERENCE_SHORT_SIDE * 3;

/** 가로 배치에서 줄인 개체 중심 반지름 하한 (배율 1). `DESIGN.md` §5 겹침 검산 */
const MIN_ITEM_RADIUS = 118.1;
/** 1분 간격이 모닥불 + 장작 필요 간격 6.5 도트가 되는 반지름. 미만이면 모닥불을 7 도트로 그림 (배율 1). `DESIGN.md` §5 겹침 검산 */
const LARGE_BONFIRE_MIN_ITEM_RADIUS = (6.5 * 60) / Math.PI;
const SMALL_BONFIRE_HEIGHT_IN_DOTS = 7;

const NUMERAL_GAP = 6;
const NUMERAL_HALF_HEIGHT = 7;
const ARC_GAP = 13;

const BUTTON_OFFSET_FROM_SAFE_AREA = 150;
const BUTTON_BOTTOM_MARGIN_MIN = 16;
const DIAL_TO_BUTTON_GAP = 90;
const BUTTON_CENTER_DISTANCE_IN_DOTS = 44;

const GRADES_FROM_LARGEST = (Object.keys(SCREEN_GRADES) as ScreenGrade[]).sort((a, b) => SCREEN_GRADES[b].minShortSide - SCREEN_GRADES[a].minShortSide);

const resolveScreenGrade = (shortSide: number): ScreenGrade => GRADES_FROM_LARGEST.find((grade) => shortSide >= SCREEN_GRADES[grade].minShortSide) ?? 'compact';

/** 개체 중심 반지름에서 시계판 위 반높이까지 (배율 1) */
const dialOuterOffset = (bonfireHeightInDots: number) => (bonfireHeightInDots * DOT_SIZE) / 2 + NUMERAL_GAP + NUMERAL_HALF_HEIGHT * 2;

const proportionalItemRadius = (shortSide: number, scale: number) => (Math.min(shortSide, MAX_SHORT_SIDE) * REFERENCE_ITEM_RADIUS) / REFERENCE_SHORT_SIDE / scale;

type SafeArea = { top: number; bottom: number; left: number; right: number };

type Rect = { left: number; top: number; right: number; bottom: number };

const distanceToRect = (x: number, y: number, rect: Rect) => Math.hypot(Math.max(rect.left - x, 0, x - rect.right), Math.max(rect.top - y, 0, y - rect.bottom));

/** 가로 배치의 조작 버튼. safe area 오른쪽 하단 */
type LandscapeButtonsInput = { safeArea: SafeArea; buttonHalfHeight: number; scale: number };

const placeLandscapeButtons = ({ safeArea, buttonHalfHeight, scale }: LandscapeButtonsInput) => {
  const centerY = safeArea.bottom - BUTTON_BOTTOM_MARGIN_MIN - buttonHalfHeight;
  const rightCenterX = safeArea.right - BUTTON_BOTTOM_MARGIN_MIN - buttonHalfHeight;
  const leftCenterX = rightCenterX - BUTTON_CENTER_DISTANCE_IN_DOTS * DOT_SIZE * scale;

  return {
    centerX: (leftCenterX + rightCenterX) / 2,
    centerY,
    // 두 버튼을 감싼 사각형. 터치 영역은 제외
    rect: { left: leftCenterX - buttonHalfHeight, top: centerY - buttonHalfHeight, right: rightCenterX + buttonHalfHeight, bottom: centerY + buttonHalfHeight },
  };
};

type PortraitInput = { safeArea: SafeArea; dialTopHalfHeight: number; buttonHalfHeight: number };

/** 세로 배치의 버튼 중심 y와 시계판 중심 y. `DESIGN.md` §7 계산 순서 11~14 */
const placePortrait = ({ safeArea, dialTopHalfHeight, buttonHalfHeight }: PortraitInput) => {
  // 배율이 달라져도 시계판-버튼 여백 90px 유지. 배율 1에서 182 + 90 + 28 = 300px
  const dialToButton = dialTopHalfHeight + DIAL_TO_BUTTON_GAP + buttonHalfHeight;
  // 시계판 위 끝부터 버튼 중심까지
  const stackHeight = dialTopHalfHeight + dialToButton;

  // 배율이 달라져도 버튼 아래 여백 16px 유지. 배율 1에서 28 + 16 = 44px
  const buttonOffsetMin = buttonHalfHeight + BUTTON_BOTTOM_MARGIN_MIN;
  const buttonOffset = Math.min(BUTTON_OFFSET_FROM_SAFE_AREA, Math.max(buttonOffsetMin, safeArea.bottom - safeArea.top - stackHeight));
  const buttonCenterY = safeArea.bottom - buttonOffset;

  return { buttonCenterY, dialCenterY: buttonCenterY - dialToButton };
};

type LayoutInput = {
  shortSide: number;
  safeAreaTopEdge: number;
  safeAreaBottomEdge: number;
  safeAreaLeftEdge?: number;
  safeAreaRightEdge?: number;
};

type Layout = {
  scale: number;
  dotSize: number;
  /** 화면 가장자리 여백 (px). `DESIGN.md` §5 배치 순서 */
  edgeMargin: number;
  screenGrade: ScreenGrade;
  bonfireHeightInDots: BonfireHeightInDots;
  isLandscape: boolean;
  itemRadius: number;
  arcRadius: number;
  numeralRadius: number;
  buttonCenterY: number;
  /** 조작 버튼 두 개의 가운데 x */
  buttonsCenterX: number;
  dialCenterX: number;
  dialCenterY: number;
};

// 좌우 경계를 생략하면 세로 화면으로 보고 너비를 짧은 변으로 사용
export const resolveLayout = ({ shortSide, safeAreaTopEdge, safeAreaBottomEdge, safeAreaLeftEdge = 0, safeAreaRightEdge = shortSide }: LayoutInput): Layout => {
  const safeArea = { top: safeAreaTopEdge, bottom: safeAreaBottomEdge, left: safeAreaLeftEdge, right: safeAreaRightEdge };
  const safeAreaWidth = safeArea.right - safeArea.left;
  const safeAreaHeight = safeArea.bottom - safeArea.top;

  const screenGrade = resolveScreenGrade(shortSide);
  const { scale, bonfireHeightInDots: gradeBonfireHeight } = SCREEN_GRADES[screenGrade];
  const buttonHalfHeight = (BUTTON_SIZE_IN_DOTS / 2) * DOT_SIZE * scale;

  // 1. 배치 선택. 짧은 변 비례 크기로 세로 배치가 들어가는지 확인
  const proportionalDialTopHalfHeight = (proportionalItemRadius(shortSide, scale) + dialOuterOffset(gradeBonfireHeight)) * scale;
  const portraitHeight = proportionalDialTopHalfHeight * 2 + DIAL_TO_BUTTON_GAP + buttonHalfHeight * 2 + BUTTON_BOTTOM_MARGIN_MIN;
  const isLandscape = safeAreaHeight < portraitHeight;

  const dialCenterX = (safeArea.left + safeArea.right) / 2;
  const landscapeDialCenterY = (safeArea.top + safeArea.bottom) / 2;
  const landscapeButtons = placeLandscapeButtons({ safeArea, buttonHalfHeight, scale });

  // 2. 시계판 크기. safe area 여백과 가로 배치 버튼에 닿지 않게 줄임
  const dialTopHalfHeight = Math.min(
    proportionalDialTopHalfHeight,
    Math.min(safeAreaWidth, safeAreaHeight) / 2 - DIAL_SAFE_AREA_MARGIN,
    isLandscape ? distanceToRect(dialCenterX, landscapeDialCenterY, landscapeButtons.rect) : Infinity,
  );

  // 3. 반지름. 줄인 크기에 맞춰 하한과 모닥불 크기를 정함
  const itemRadius = Math.max(dialTopHalfHeight / scale - dialOuterOffset(gradeBonfireHeight), MIN_ITEM_RADIUS);
  const bonfireHeightInDots = itemRadius < LARGE_BONFIRE_MIN_ITEM_RADIUS ? SMALL_BONFIRE_HEIGHT_IN_DOTS : gradeBonfireHeight;
  const bonfireHalfHeight = (bonfireHeightInDots * DOT_SIZE) / 2;
  const arcRadius = itemRadius - bonfireHalfHeight - ARC_GAP;
  const numeralRadius = itemRadius + bonfireHalfHeight + NUMERAL_GAP + NUMERAL_HALF_HEIGHT;

  // 4. 위치
  const portrait = placePortrait({ safeArea, dialTopHalfHeight: (numeralRadius + NUMERAL_HALF_HEIGHT) * scale, buttonHalfHeight });

  return {
    scale,
    dotSize: DOT_SIZE * scale,
    edgeMargin: EDGE_MARGIN * scale,
    screenGrade,
    bonfireHeightInDots,
    isLandscape,
    itemRadius: itemRadius * scale,
    arcRadius: arcRadius * scale,
    numeralRadius: numeralRadius * scale,
    buttonCenterY: isLandscape ? landscapeButtons.centerY : portrait.buttonCenterY,
    buttonsCenterX: isLandscape ? landscapeButtons.centerX : dialCenterX,
    dialCenterX,
    dialCenterY: isLandscape ? landscapeDialCenterY : portrait.dialCenterY,
  };
};
