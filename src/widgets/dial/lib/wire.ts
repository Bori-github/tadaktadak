import { type ColoredDot } from './atlas';
import { pointOnDial } from './geometry';
import { bulbCenter, type DialPlacement } from '@/shared/lib';

const WIRE_COLOR = '#1c2a1a';

/** 구간당 표본 간격 수. 구간 길이 50 dot 초과 시 도트 누락 */
const SAMPLES_PER_SEGMENT = 50;

type Point = { x: number; y: number };

const catmullRom = (p0: number, p1: number, p2: number, p3: number, t: number): number =>
  0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t ** 2 + (3 * p1 - p0 - 3 * p2 + p3) * t ** 3);

/**
 * 전선 도트. 12시 지점과 1~`settingMinutes`번 전구 중심을 잇는 Catmull-Rom 곡선
 *
 * @param settingMinutes - 설정 시간(분). 마지막 전구의 눈금 번호
 * @param dial - 시계판 위치와 도트 크기
 * @returns 도트 격자 좌표. 중복 제거
 */
export const wireDots = (settingMinutes: number, dial: DialPlacement): ColoredDot[] => {
  const points: Point[] = [pointOnDial(dial.centerX, dial.centerY, dial.radius, 0)];
  for (let tick = 1; tick <= settingMinutes; tick++) points.push(bulbCenter(tick, dial));

  const at = (index: number): Point => points[Math.min(Math.max(index, 0), points.length - 1)] ?? { x: 0, y: 0 };
  const dots = new Map<string, ColoredDot>();

  // 리스 잎 뒤로 통과하는 구간 표현을 위해 홀수 구간 생략
  for (let segment = 0; segment < points.length - 1; segment += 2) {
    const [p0, p1, p2, p3] = [at(segment - 1), at(segment), at(segment + 1), at(segment + 2)];

    for (let sample = 0; sample <= SAMPLES_PER_SEGMENT; sample++) {
      const t = sample / SAMPLES_PER_SEGMENT;
      const x = Math.floor(catmullRom(p0.x, p1.x, p2.x, p3.x, t) / dial.dotSize);
      const y = Math.floor(catmullRom(p0.y, p1.y, p2.y, p3.y, t) / dial.dotSize);
      dots.set(`${x},${y}`, { x, y, color: WIRE_COLOR });
    }
  }

  return [...dots.values()];
};
