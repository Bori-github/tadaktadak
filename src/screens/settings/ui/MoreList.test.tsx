import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Linking } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { MoreList } from './MoreList';

import { initLocalization } from '@/entities/language';

let mockIsPrivacyOptionsRequired = false;
const mockShowPrivacyOptions = jest.fn(async () => {});

// import 시 `TurboModuleRegistry.getEnforcing`이 `RNGoogleMobileAdsModule` 미등록으로 예외를 던져 개인정보 옵션 API를 테스트별 반환값 제어용 목으로 대체
jest.mock('@/entities/advertisement', () => ({
  usePrivacyOptionsRequired: () => mockIsPrivacyOptionsRequired,
  showPrivacyOptions: () => mockShowPrivacyOptions(),
}));
beforeAll(() => {
  initLocalization();
});

beforeEach(() => {
  mockIsPrivacyOptionsRequired = false;
  mockShowPrivacyOptions.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('더보기 화면 목록', () => {
  it('개인정보처리방침 행을 누르면 개인정보처리방침 페이지를 연다', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await render(<MoreList dotSize={2} />);

    await fireEvent.press(screen.getByTestId('more-privacy-policy'));

    expect(openURL).toHaveBeenCalledWith('https://qhflrnfl4324.notion.site/tadaktadak');
  });

  it('개인정보 옵션이 필요하면 개인정보 옵션 행을 렌더링한다', async () => {
    mockIsPrivacyOptionsRequired = true;
    await render(<MoreList dotSize={2} />);

    expect(screen.queryByTestId('more-privacy-options')).not.toBeNull();
  });

  it('개인정보 옵션이 필요하지 않으면 개인정보 옵션 행을 렌더링하지 않는다', async () => {
    await render(<MoreList dotSize={2} />);

    expect(screen.queryByTestId('more-privacy-options')).toBeNull();
  });

  it('개인정보 옵션 행을 누르면 `showPrivacyOptions`를 호출한다', async () => {
    mockIsPrivacyOptionsRequired = true;
    await render(<MoreList dotSize={2} />);

    await fireEvent.press(screen.getByTestId('more-privacy-options'));

    expect(mockShowPrivacyOptions).toHaveBeenCalledTimes(1);
  });
});
