import { createContext, Fragment, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type JSX, type ReactNode, type RefObject } from 'react';
import { BackHandler, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

type PortalEntry = {
  node: ReactNode;
  onDismiss?: () => void;
};

type PortalContextValue = {
  hostRef: RefObject<View | null>;
  /** `PortalHost` 너비 (px). 첫 레이아웃 전에는 0 */
  hostWidth: number;
  mount: (key: string, entry: PortalEntry) => void;
  unmount: (key: string) => void;
};

const PortalContext = createContext<PortalContextValue | null>(null);

const usePortalContext = (): PortalContextValue => {
  const context = useContext(PortalContext);

  if (context === null) throw new Error('Portal은 PortalHost 안에서만 쓸 수 있음');

  return context;
};

type PortalHostProps = {
  /** 스플래시나 다른 화면에 가려진 동안 `false`. `false`면 `Portal` 내용과 `DismissLayer`를 렌더링하지 않고 `BackHandler` 리스너 해제 */
  isEnabled?: boolean;
  children: ReactNode;
};

/**
 * `Portal` 자식 요소를 `children`의 형제로 렌더링하는 화면 루트.
 * 화면 `GestureDetector` 안쪽에 배치하면 그 제스처가 붙은 뷰가 `Portal` 자식 요소의 조상이 되어 바깥에 배치
 *
 * @returns `children`과 `Portal` 내용을 담은 `View`
 */
export const PortalHost = ({ isEnabled = true, children }: PortalHostProps): JSX.Element => {
  const hostRef = useRef<View>(null);
  const [hostWidth, setHostWidth] = useState(0);
  const [entries, setEntries] = useState<ReadonlyMap<string, PortalEntry>>(new Map());

  const mount = useCallback((key: string, entry: PortalEntry) => {
    setEntries((previous) => new Map(previous).set(key, entry));
  }, []);

  const unmount = useCallback((key: string) => {
    setEntries((previous) => {
      const next = new Map(previous);
      next.delete(key);

      return next;
    });
  }, []);

  const value = useMemo<PortalContextValue>(() => ({ hostRef, hostWidth, mount, unmount }), [hostWidth, mount, unmount]);

  // 터치와 `BackHandler`가 같은 `Portal`을 닫도록 마지막에 mount한 `Portal`의 `onDismiss`만 호출
  const dismissTop = isEnabled ? [...entries.values()].findLast((entry) => entry.onDismiss !== undefined)?.onDismiss : undefined;
  const isDismissible = dismissTop !== undefined;
  const dismissTopRef = useRef(dismissTop);

  useEffect(() => {
    dismissTopRef.current = dismissTop;
  }, [dismissTop]);

  // `onDismiss`가 바뀌어도 `BackHandler` 리스너 재등록, `DismissLayer` 제스처 재생성이 없도록 ref로 최신 `onDismiss` 호출
  const dismiss = useCallback(() => {
    dismissTopRef.current?.();
  }, []);

  useEffect(() => {
    if (!isDismissible) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      dismiss();

      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [isDismissible, dismiss]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setHostWidth(event.nativeEvent.layout.width);
  };

  return (
    <PortalContext.Provider value={value}>
      <View ref={hostRef} style={styles.root} collapsable={false} onLayout={handleLayout}>
        {children}
        {isDismissible ? <DismissLayer onDismiss={dismiss} /> : null}
        {isEnabled ? [...entries].map(([key, entry]) => <Fragment key={key}>{entry.node}</Fragment>) : null}
      </View>
    </PortalContext.Provider>
  );
};

/**
 * `PortalHost` 전체를 덮는 터치 수신 레이어.
 * Android react-native-gesture-handler가 제스처와 배경이 없는 뷰를 히트 테스트에서 제외하고 하위 형제 뷰의 제스처로 터치를 전달해 레이어에 제스처 지정
 *
 * @returns 제스처를 지정한 레이어
 */
const DismissLayer = ({ onDismiss }: { onDismiss: () => void }): JSX.Element => {
  const dismissGesture = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onBegin(() => {
          onDismiss();
        })
        .withTestId('portal-dismiss-layer'),
    [onDismiss],
  );

  return (
    <GestureDetector gesture={dismissGesture}>
      <View style={StyleSheet.absoluteFill} />
    </GestureDetector>
  );
};

type PortalProps = {
  /** 표시 중 화면 터치, Android 뒤로 가기 시 호출. 같은 `PortalHost`에서는 마지막에 mount한 `Portal`만 호출 */
  onDismiss?: () => void;
  children: ReactNode;
};

/**
 * `children`을 가장 가까운 `PortalHost`에 렌더링
 *
 * @returns `null`. 자식 요소는 `PortalHost`가 렌더링
 */
export const Portal = ({ onDismiss, children }: PortalProps): null => {
  const { mount, unmount } = usePortalContext();
  const key = useId();

  useEffect(() => {
    mount(key, { node: children, onDismiss });
  }, [mount, key, children, onDismiss]);

  useEffect(
    () => () => {
      unmount(key);
    },
    [unmount, key],
  );

  return null;
};

/**
 * 가장 가까운 `PortalHost`의 ref와 너비. `Portal` 자식 요소의 좌표 기준
 *
 * @returns `PortalHost` ref, 너비 (px)
 */
export const usePortalHost = (): Pick<PortalContextValue, 'hostRef' | 'hostWidth'> => {
  const { hostRef, hostWidth } = usePortalContext();

  return { hostRef, hostWidth };
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
