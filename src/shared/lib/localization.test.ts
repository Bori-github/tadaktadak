import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';

import appConfig from '../../../app.json';
import koAppMetadata from '../../../languages/ko.json';

import { parseLanguage, pickLanguage, restoreLanguage, selectLanguage, translate, useLanguage } from './localization';

import { loadLanguage, saveLanguage } from '@/shared/api';

const mockDeviceLocales = [{ languageCode: 'ko' }];

jest.mock('expo-localization', () => ({
  useLocales: () => mockDeviceLocales,
}));

const toLocales = (...codes: (string | null)[]) => codes.map((languageCode) => ({ languageCode }));

const readWidgetFile = (name: string): string => readFileSync(join(__dirname, '../../../targets/widget', name), 'utf8');

describe('기기 선호 언어에서 지원 언어 고르기', () => {
  it('첫 항목이 지원 목록에 있으면 그 항목의 언어를 반환한다', () => {
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

describe('저장된 언어 태그 검증', () => {
  it('저장값이 없으면 null을 반환한다', () => {
    expect(parseLanguage(null)).toBeNull();
  });

  it('지원 목록에 없는 언어 태그면 null을 반환한다', () => {
    expect(parseLanguage('ja-JP')).toBeNull();
  });
});

describe('선택한 언어', () => {
  // 저장소와 모듈이 기억하는 선택을 함께 비워 앱을 처음 켠 상태에서 시작
  beforeEach(async () => {
    await AsyncStorage.clear();
    await restoreLanguage();
  });

  it('저장된 언어가 없으면 기기 언어인 한국어를 반환한다', async () => {
    const { result } = await renderHook(() => useLanguage());

    await act(async () => {
      await restoreLanguage();
    });

    expect(result.current).toBe('ko-KR');
  });

  it('저장된 언어가 영어면 기기 언어가 한국어여도 영어를 반환한다', async () => {
    await saveLanguage('en-US');
    const { result } = await renderHook(() => useLanguage());

    await act(async () => {
      await restoreLanguage();
    });

    expect(result.current).toBe('en-US');
  });

  it('언어를 선택하면 바로 반환하고 기기에 저장한다', async () => {
    const { result } = await renderHook(() => useLanguage());

    await act(async () => {
      selectLanguage('en-US');
    });

    expect(result.current).toBe('en-US');
    expect(await loadLanguage()).toBe('en-US');
  });

  it('저장값을 읽는 동안 선택하면 선택한 언어를 유지한다', async () => {
    await saveLanguage('ko-KR');
    const { result } = await renderHook(() => useLanguage());

    await act(async () => {
      const restoring = restoreLanguage();
      selectLanguage('en-US');
      await restoring;
    });

    expect(result.current).toBe('en-US');
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

  it('Localizable.xcstrings가 영어 이름을 키로 두고 한국어 이름을 값으로 둔다', () => {
    const catalog: unknown = JSON.parse(readWidgetFile('Localizable.xcstrings'));

    expect(catalog).toMatchObject({
      strings: {
        [translate('app.name', 'en-US')]: {
          localizations: { ko: { stringUnit: { value: translate('app.name', 'ko-KR') } } },
        },
      },
    });
  });

  it('TimerLiveActivity.swift의 문구가 Localizable.xcstrings의 키와 같다', () => {
    expect(readWidgetFile('TimerLiveActivity.swift')).toContain(`Text("${translate('app.name', 'en-US')}")`);
  });
});
