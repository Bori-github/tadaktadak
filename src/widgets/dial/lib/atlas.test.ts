import { describe, expect, it } from '@jest/globals';

import { packSprites } from './atlas';

const SMALL = ['ab', 'cd'];
const TALL = ['xyz', 'xyz', 'xyz'];

describe('아틀라스 배치', () => {
  it('격자 사이에 한 도트를 비우고 가장 높은 격자에 높이를 맞춘다', () => {
    expect(packSprites([SMALL, TALL])).toEqual({
      image: { widthInDots: 6, heightInDots: 3 },
      boxes: [
        { left: 0, top: 0, widthInDots: 2, heightInDots: 2 },
        { left: 3, top: 0, widthInDots: 3, heightInDots: 3 },
      ],
    });
  });

  it('첫 줄이 짧아도 가장 긴 줄에 폭을 맞춘다', () => {
    expect(packSprites([['ab', 'cdef']]).boxes).toEqual([{ left: 0, top: 0, widthInDots: 4, heightInDots: 2 }]);
  });

  it('격자가 없으면 이미지도 없다', () => {
    expect(packSprites([])).toEqual({ image: { widthInDots: 0, heightInDots: 0 }, boxes: [] });
  });
});
