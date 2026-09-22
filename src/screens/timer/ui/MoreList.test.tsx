import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Linking } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { MoreList } from './MoreList';

import { initLocalization } from '@/entities/language';

beforeAll(() => {
  initLocalization();
});

describe('MoreList', () => {
  it('개인정보처리방침 행을 누르면 개인정보 처리방침 페이지를 연다', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await render(<MoreList dotSize={2} />);

    await fireEvent.press(screen.getByTestId('more-privacy-policy'));

    expect(openURL).toHaveBeenCalledWith('https://qhflrnfl4324.notion.site/tadaktadak');
  });
});
