import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { NotificationSettingsButton } from './NotificationSettingsButton';

jest.mock('@modules/haptic-pattern', () => ({ hapticPattern: { play: () => {} } }));

describe('누름', () => {
  it('알림 설정 버튼을 누르면 시스템 설정을 연다', async () => {
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    await render(<NotificationSettingsButton dotSize={2} />);
    await fireEvent.press(screen.getByRole('button'));

    expect(openSettings).toHaveBeenCalledTimes(1);
    openSettings.mockRestore();
  });
});
