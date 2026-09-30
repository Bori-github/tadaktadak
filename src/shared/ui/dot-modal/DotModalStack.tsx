import { useCallback, useState, type JSX, type ReactNode } from 'react';

import { DotModal } from './DotModal';

type ModalNavigation<TView extends string> = {
  open: (view: TView) => void;
};

export type DotModalScreen<TView extends string> = {
  render: (navigation: ModalNavigation<TView>) => ReactNode;
};

type DotModalStackProps<TView extends string> = {
  /** 도트 한 변 (px) */
  dotSize: number;
  initial: TView;
  screens: Record<TView, DotModalScreen<TView>>;
  onClose: () => void;
};

/**
 * 화면 스택을 관리하는 공용 모달. 깊이가 2 이상이면 뒤로 버튼을 표시하고 Android 뒤로 버튼을 pop에 연결
 *
 * @returns 스택 최상단 화면을 렌더한 모달
 */
export const DotModalStack = <TView extends string>({ dotSize, initial, screens, onClose }: DotModalStackProps<TView>): JSX.Element | null => {
  const [views, setViews] = useState<TView[]>([initial]);

  const open = useCallback((view: TView) => {
    setViews((previous) => (previous[previous.length - 1] === view ? previous : [...previous, view]));
  }, []);

  const back = useCallback(() => {
    setViews((previous) => (previous.length === 1 ? previous : previous.slice(0, -1)));
  }, []);

  const screen = screens[views[views.length - 1] ?? initial];
  if (screen === undefined) return null;

  return (
    <DotModal dotSize={dotSize} onClose={onClose} onBack={views.length > 1 ? back : undefined}>
      {screen.render({ open })}
    </DotModal>
  );
};
