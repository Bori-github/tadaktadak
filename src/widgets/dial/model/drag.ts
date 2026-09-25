import { useCallback, useEffect, useMemo, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { isWithinThumb, minutesFromPoint, pointOnDial } from '../lib/geometry';

import { TIMER_RANGE, type TimerMode } from '@/entities/timer';
import { holdVibration, playVibration, releaseVibration } from '@/entities/vibration';

type DialDragInput = {
  /** 시계판 중심 (px) */
  centerX: number;
  centerY: number;
  /** 손잡이가 도는 반지름 (px) */
  radius: number;
  dotSize: number;
  /** 손잡이가 가리키는 시간(분) */
  minutes: number;
  /** 끌어서 설정할 타이머 */
  mode: TimerMode;
  /** 손잡이를 끌 수 있는지 여부. `DESIGN.md` §8 조작 */
  enabled: boolean;
  onChange: (minutes: number) => void;
  onChangeEnd: (minutes: number) => void;
};

type DialDrag = {
  gesture: ReturnType<typeof Gesture.Pan>;
  /** 터치 위치의 스냅된 시간(분). UI 스레드에서 터치 이벤트마다 갱신 */
  draggedMinutes: SharedValue<number>;
  /** `true`면 시계판이 `draggedMinutes`를 렌더링. 드래그 종료 후 JS 스레드가 드래그 결과를 커밋할 때까지 유지 */
  isShowingDragged: SharedValue<boolean>;
};

/**
 * 손잡이를 끌어 타이머 시간을 바꾸는 제스처.
 *
 * @param input.onChange - 스냅된 타이머 시간이 바뀔 때 호출
 * @param input.onChangeEnd - 손을 뗄 때 호출. 끌면서 시간이 한 번이라도 바뀐 경우만
 * @returns 제스처와 드래그 공유 값
 */
export const useDialDrag = ({ centerX, centerY, radius, dotSize, minutes, mode, enabled, onChange, onChangeEnd }: DialDragInput): DialDrag => {
  const dragged = useSharedValue(minutes);
  const grabbed = useSharedValue(false);
  const pointerId = useSharedValue(-1);
  const changed = useSharedValue(false);
  const isShowingDragged = useSharedValue(false);
  // `minutes`의 UI 스레드 사본. 워클릿이 클로저 대신 읽어 `minutes` 변경 시 `Gesture` 재생성 방지
  const committed = useSharedValue(minutes);
  // 드래그 종료 신호. `scheduleOnRN` 큐에서 `onChange`·`onChangeEnd` 뒤에 실행되어 그 커밋 이후 `isShowingDragged` 해제
  const [settledCount, setSettledCount] = useState(0);
  const settle = useCallback(() => {
    setSettledCount((count) => count + 1);
  }, []);

  // 끌기 도중 제스처가 버려지면 `onFinalize`가 호출되지 않아, 언마운트 시 자동 종료를 되돌림
  useEffect(
    () => () => {
      releaseVibration();
    },
    [],
  );

  const gesture = useMemo(() => {
    const { min, max } = TIMER_RANGE[mode];

    return (
      Gesture.Pan()
        .enabled(enabled)
        // 제스처가 활성화되면 같은 자리의 버튼·숫자 누름이 취소됨
        .manualActivation(true)
        .onTouchesDown((event, manager) => {
          // 현재 드래그 중인 상태 외 추가되는 터치 이벤트를 막아 타이머 설정 시간이 튀는 것 방지
          if (grabbed.value) return;

          const touch = event.changedTouches[0];
          if (!touch) return;

          // `isShowingDragged`면 렌더링 중인 `draggedMinutes` 좌표로 히트 테스트
          const start = isShowingDragged.value ? dragged.value : committed.value;
          const thumb = pointOnDial(centerX, centerY, radius, start * 6);

          grabbed.value = isWithinThumb({ thumbX: thumb.x, thumbY: thumb.y, x: touch.x, y: touch.y, dotSize });
          dragged.value = start;
          changed.value = false;
          pointerId.value = touch.id;
          if (grabbed.value) {
            isShowingDragged.value = true;
            scheduleOnRN(holdVibration);
          }
          if (!grabbed.value) manager.fail();
        })
        .onTouchesMove((event, manager) => {
          if (!grabbed.value) return;
          manager.activate();

          const touch = event.allTouches.find((moved) => moved.id === pointerId.value);
          if (!touch) return;

          const next = minutesFromPoint({ centerX, centerY, x: touch.x, y: touch.y, previous: dragged.value, min, max });
          if (next === dragged.value) return;

          dragged.value = next;
          changed.value = true;
          scheduleOnRN(playVibration);
          scheduleOnRN(onChange, next);
        })
        .onFinalize(() => {
          if (grabbed.value) scheduleOnRN(releaseVibration);
          if (changed.value) scheduleOnRN(onChangeEnd, dragged.value);
          if (grabbed.value) scheduleOnRN(settle);

          grabbed.value = false;
          changed.value = false;
          pointerId.value = -1;
        })
    );
    // `useSharedValue`가 준 값은 고정 참조라 의존성 배열에서 제거. 넣으면 React Compiler 린트가 안에서 쓰는 것을 막음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerX, centerY, radius, dotSize, mode, enabled, onChange, onChangeEnd, settle]);

  useEffect(() => {
    committed.value = minutes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minutes]);

  // `grabbed`면 이전 드래그의 `settle`이라 해제 생략. 현재 드래그의 `onFinalize`가 `settle`을 다시 전송
  useEffect(() => {
    if (!grabbed.value) isShowingDragged.value = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settledCount]);

  return { gesture, draggedMinutes: dragged, isShowingDragged };
};
