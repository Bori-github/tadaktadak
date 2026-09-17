import { describe, expect, it } from '@jest/globals';

import { pickLanguage, translate } from './localization';

const toLocales = (...codes: (string | null)[]) => codes.map((languageCode) => ({ languageCode }));

describe('기기 선호 언어에서 지원 언어 고르기', () => {
  it('첫 항목이 지원 목록에 있으면 그 언어를 반환한다', () => {
    expect(pickLanguage(toLocales('ko'))).toBe('ko-KR');
  });

  it('선호 순서대로 순회해 처음 일치하는 언어를 반환한다', () => {
    expect(pickLanguage(toLocales('ja', 'ko', 'en'))).toBe('ko-KR');
  });

  it('일치하는 언어가 없으면 en-US를 반환한다', () => {
    expect(pickLanguage(toLocales('de', 'fr'))).toBe('en-US');
  });

  it('languageCode가 null인 항목은 건너뛴다', () => {
    expect(pickLanguage(toLocales(null, 'ko'))).toBe('ko-KR');
  });
});

describe('언어별 문구 조회', () => {
  it('같은 키를 언어마다 다른 문구로 반환한다', () => {
    expect(translate('timer.focus', 'ko-KR')).toBe('집중 끝!');
    expect(translate('timer.focus', 'en-US')).toBe('Boom, done!');
  });
});
