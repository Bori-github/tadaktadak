import { describe, expect, it } from '@jest/globals';

import {
  BONFIRE_COLD_7,
  BONFIRE_COLD_9,
  BONFIRE_HOT_A_7,
  BONFIRE_HOT_A_9,
  BONFIRE_HOT_B_7,
  BONFIRE_HOT_B_9,
  LOG_COLD,
  LOG_HOT_A,
  LOG_HOT_B,
  MARKER,
  SPARK_A,
  SPARK_REST,
  SPRITE_COLORS,
} from './sprites';

describe('모닥불 7 도트는 9 도트에서 위 두 줄을 뺀 것이다', () => {
  it.each([
    { frame: '붙지 않음', tall: BONFIRE_COLD_9, short: BONFIRE_COLD_7 },
    { frame: '타는 중 A', tall: BONFIRE_HOT_A_9, short: BONFIRE_HOT_A_7 },
    { frame: '타는 중 B', tall: BONFIRE_HOT_B_9, short: BONFIRE_HOT_B_7 },
  ])('$frame', ({ tall, short }) => {
    expect(tall.slice(2)).toEqual(short);
  });
});

describe('개체 규격', () => {
  it.each([
    { name: '장작 붙지 않음', grid: LOG_COLD, width: 3, height: 4 },
    { name: '장작 타는 중 A', grid: LOG_HOT_A, width: 3, height: 4 },
    { name: '장작 타는 중 B', grid: LOG_HOT_B, width: 3, height: 4 },
    { name: '모닥불 9 도트', grid: BONFIRE_HOT_A_9, width: 7, height: 9 },
    { name: '모닥불 7 도트', grid: BONFIRE_HOT_A_7, width: 7, height: 7 },
    { name: '스파크 손잡이', grid: SPARK_A, width: 7, height: 7 },
    { name: '기준 표식', grid: MARKER, width: 3, height: 5 },
  ])('$name은 $width × $height이다', ({ grid, width, height }) => {
    expect({ width: Math.max(...grid.map((line) => line.length)), height: grid.length }).toEqual({ width, height });
  });
});

describe('격자에 색 없는 글자를 쓰지 않는다', () => {
  const GRIDS = [LOG_COLD, LOG_HOT_A, LOG_HOT_B, BONFIRE_COLD_9, BONFIRE_HOT_A_9, BONFIRE_HOT_B_9, SPARK_A, SPARK_REST, MARKER];

  const LETTERS = [...new Set(GRIDS.map((grid) => grid.join('')).join(''))].filter((letter) => letter !== '.');

  it.each(LETTERS)('%s에 색이 있다', (letter) => {
    expect(SPRITE_COLORS[letter]).toEqual(expect.any(String));
  });
});
