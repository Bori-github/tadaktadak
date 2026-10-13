interface StoredSettingOptions<TValue> {
  /** `restore` 완료 전 값 */
  initialValue: TValue;
  load: () => Promise<TValue>;
  save: (value: TValue) => Promise<void>;
}

interface StoredSetting<TValue> {
  get: () => TValue;
  /** 값 즉시 반영 후 `save` 호출 */
  set: (value: TValue) => void;
  /** `load` 결과 반영. 앱 시작 시 1회 호출 */
  restore: () => Promise<void>;
  subscribe: (listener: () => void) => () => void;
}

/**
 * 영속 설정 값 하나의 외부 store. `subscribe`/`get`은 `useSyncExternalStore` 인자로 사용
 *
 * @returns `get`/`set`/`restore`/`subscribe`
 */
export const createStoredSetting = <TValue>({ initialValue, load, save }: StoredSettingOptions<TValue>): StoredSetting<TValue> => {
  let value = initialValue;
  let setCount = 0;
  const listeners = new Set<() => void>();

  const apply = (next: TValue): void => {
    value = next;
    listeners.forEach((listener) => {
      listener();
    });
  };

  const get = (): TValue => value;

  const set = (next: TValue): void => {
    setCount += 1;
    apply(next);

    // 저장 실패 시 메모리 값만 반영. 다음 실행은 이전 저장값으로 복원
    save(next).catch(() => {});
  };

  const restore = async (): Promise<void> => {
    const setCountAtStart = setCount;

    let saved: TValue;
    try {
      saved = await load();
    } catch {
      // 읽기 실패 시 현재 값 유지
      return;
    }

    // 로드 중 `set` 호출 시 저장값 반영 생략
    if (setCount !== setCountAtStart) return;

    apply(saved);
  };

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { get, set, restore, subscribe };
};
