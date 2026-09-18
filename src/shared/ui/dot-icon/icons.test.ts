import { describe, expect, it } from '@jest/globals';

import { NOTIFICATION_OFF_ICON } from './notificationOff';
import { PAUSE_ICON } from './pause';
import { PLAY_ICON } from './play';
import { SETTINGS_ICON } from './settings';
import { STOP_ICON } from './stop';

const GRIDS = [
  { name: '재생', grid: PLAY_ICON },
  { name: '일시정지', grid: PAUSE_ICON },
  { name: '정지', grid: STOP_ICON },
];

// DotSprite는 색 매핑에 없는 문자를 건너뜀. 오타 문자는 도트가 조용히 사라짐
describe('아이콘 격자', () => {
  it.each(GRIDS)('$name은 12×12다', ({ grid }) => {
    expect(grid).toHaveLength(12);
    for (const line of grid) {
      expect(line).toHaveLength(12);
    }
  });

  it.each(GRIDS)('$name은 I와 비움만 쓴다', ({ grid }) => {
    for (const line of grid) {
      expect(line).toMatch(/^[I.]+$/);
    }
  });
});

describe('알림 끔 아이콘', () => {
  it('상자 한 변이 24다', () => {
    // 12 도트 × 도트 한 변 2. `DESIGN.md` §4
    expect(NOTIFICATION_OFF_ICON.boxSize).toBe(24);
  });

  // 상자를 넘는 사각형은 버튼 테두리 밖에 그려짐
  it.each(NOTIFICATION_OFF_ICON.rects)('[%i, %i, %i, %i]가 상자 안에 있다', (x, y, width, height) => {
    const { boxSize } = NOTIFICATION_OFF_ICON;

    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(x + width).toBeLessThanOrEqual(boxSize);
    expect(y + height).toBeLessThanOrEqual(boxSize);
  });
});

describe('설정 아이콘', () => {
  it('상자 한 변이 24다', () => {
    expect(SETTINGS_ICON.boxSize).toBe(24);
  });

  it.each(SETTINGS_ICON.rects)('[%i, %i, %i, %i]가 상자 안에 있다', (x, y, width, height) => {
    const { boxSize } = SETTINGS_ICON;

    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(x + width).toBeLessThanOrEqual(boxSize);
    expect(y + height).toBeLessThanOrEqual(boxSize);
  });
});
