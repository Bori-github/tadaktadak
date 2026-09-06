import { describe, expect, it } from '@jest/globals';

import { PAUSE_ICON, PLAY_ICON, STOP_ICON } from './icons';

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
