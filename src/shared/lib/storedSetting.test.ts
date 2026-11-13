import { describe, expect, it, jest } from '@jest/globals';

import { createStoredSetting } from './storedSetting';

describe('영속 설정 값 하나의 외부 store', () => {
  it('subscribe 해제 후 set 호출 시 리스너를 호출하지 않는다', () => {
    const setting = createStoredSetting({ initialValue: false, load: async () => false, save: async () => {} });
    const listener = jest.fn();

    const unsubscribe = setting.subscribe(listener);
    unsubscribe();
    setting.set(true);

    expect(listener).not.toHaveBeenCalled();
  });
});
