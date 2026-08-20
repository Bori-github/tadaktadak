import { describe, expect, it } from '@jest/globals';

import { ICONS } from './icons';

// DotSprite는 색 매핑에 없는 문자를 건너뜀. 오타 문자는 도트가 조용히 사라짐
describe('아이콘 격자', () => {
  const names = Object.keys(ICONS) as (keyof typeof ICONS)[];

  it.each(names)('%s는 12×12다', (name) => {
    const grid = ICONS[name];
    expect(grid).toHaveLength(12);
    for (const line of grid) {
      expect(line).toHaveLength(12);
    }
  });

  it.each(names)('%s는 I와 비움만 쓴다', (name) => {
    for (const line of ICONS[name]) {
      expect(line).toMatch(/^[I.]+$/);
    }
  });
});
