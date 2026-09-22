import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { SettingsModal } from './SettingsModal';

import { initLocalization } from '@/entities/language';

// 진동 토글은 이 테스트 대상이 아니고 reanimated가 jest에서 초기화되지 않아서 목으로 대체
jest.mock('@/shared/ui/dot-toggle', () => ({ DotToggle: () => null }));

beforeAll(() => {
  initLocalization();
});

describe('SettingsModal', () => {
  it('더보기 행을 누르면 더보기 화면을 연다', async () => {
    await render(<SettingsModal visible dotSize={2} onClose={() => {}} />);

    await fireEvent.press(screen.getByTestId('settings-more'));

    expect(screen.queryByTestId('more-privacy-policy')).not.toBeNull();
  });
});
