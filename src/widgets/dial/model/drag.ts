import { useEffect, useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { isWithinThumb, minutesFromPoint, pointOnDial } from '../lib/geometry';

import { TIMER_RANGE, type TimerMode } from '@/entities/timer';
import { holdVibration, playVibration, releaseVibration } from '@/shared/lib';

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

/**
 * 손잡이를 끌어 타이머 시간을 바꾸는 제스처.
 *
 * @param input.onChange - 스냅된 타이머 시간이 바뀔 때 호출
 * @param input.onChangeEnd - 손을 뗄 때 호출. 끌면서 시간이 한 번이라도 바뀐 경우만
 * @returns `GestureDetector`에 넘길 제스처
 */
export const useDialDrag = ({ centerX, centerY, radius, dotSize, minutes, mode, enabled, onChange, onChangeEnd }: DialDragInput): ReturnType<typeof Gesture.Pan> => {
  const dragged = useSharedValue(minutes);
  const grabbed = useSharedValue(false);
  const pointerId = useSharedValue(-1);
  const changed = useSharedValue(false);

  // 끌기 도중 제스처가 버려지면 `onFinalize`가 호출되지 않아, 언마운트 시 자동 종료를 되돌림
  useEffect(
    () => () => {
      releaseVibration();
    },
    [],
  );

  return useMemo(() => {
    const { min, max } = TIMER_RANGE[mode];
    const thumb = pointOnDial(centerX, centerY, radius, minutes * 6);

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

          grabbed.value = isWithinThumb({ thumbX: thumb.x, thumbY: thumb.y, x: touch.x, y: touch.y, dotSize });
          dragged.value = minutes;
          changed.value = false;
          pointerId.value = touch.id;
          if (grabbed.value) scheduleOnRN(holdVibration);
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

          grabbed.value = false;
          changed.value = false;
          pointerId.value = -1;
        })
    );
    // `useSharedValue`가 준 값은 고정 참조라 의존성 배열에서 제거. 넣으면 React Compiler 린트가 안에서 쓰는 것을 막음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerX, centerY, radius, dotSize, minutes, mode, enabled, onChange, onChangeEnd]);
};
