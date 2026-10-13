import { describe, expect, it, jest } from '@jest/globals';

import { createStoredSetting } from './storedSetting';

describe('createStoredSetting', () => {
  it('restore 중 set 호출 시 값이 초기값과 같아도 load 결과를 반영하지 않는다', async () => {
    let resolveLoad: (saved: boolean) => void = () => {};
    const setting = createStoredSetting({
      initialValue: false,
      load: () =>
        new Promise<boolean>((resolve) => {
          resolveLoad = resolve;
        }),
      save: async () => {},
    });

    const restoring = setting.restore();
    setting.set(true);
    setting.set(false);
    resolveLoad(true);
    await restoring;

    expect(setting.get()).toBe(false);
  });

  it('subscribe 해제 후 set 호출 시 리스너를 호출하지 않는다', () => {
    const setting = createStoredSetting({ initialValue: false, load: async () => false, save: async () => {} });
    const listener = jest.fn();

    const unsubscribe = setting.subscribe(listener);
    unsubscribe();
    setting.set(true);

    expect(listener).not.toHaveBeenCalled();
  });
});
