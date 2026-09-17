import { describe, expect, it } from '@jest/globals';

import appConfig from '../../../app.json';
import koAppMetadata from '../../../languages/ko.json';

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

describe('앱 이름 동기화', () => {
  it('번역 리소스와 빌드 설정의 이름이 같다', () => {
    expect(translate('app.name', 'en-US')).toBe(appConfig.expo.name);
    expect(translate('app.name', 'ko-KR')).toBe(koAppMetadata.ios.CFBundleDisplayName);
  });

  it('한국어 이름이 iOS와 Android에서 같다', () => {
    expect(koAppMetadata.android.app_name).toBe(koAppMetadata.ios.CFBundleDisplayName);
  });
});
