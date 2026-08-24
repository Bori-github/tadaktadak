import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { isOnHandle, minutesFromPoint, pointOnDial } from '../lib/geometry';

import { TIMER_RANGE, type TimerMode } from '@/entities/timer';

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
};

/**
 * 손잡이를 끌어 타이머 시간을 바꾸는 제스처.
 *
 * @param input.onChange - 스냅된 타이머 시간이 바뀔 때 호출
 * @returns `GestureDetector`에 넘길 제스처
 */
export const useDialDrag = ({ centerX, centerY, radius, dotSize, minutes, mode, enabled, onChange }: DialDragInput) => {
  const dragged = useSharedValue(minutes);
  const grabbed = useSharedValue(false);

  const { min, max } = TIMER_RANGE[mode];
  const handle = pointOnDial(centerX, centerY, radius, minutes * 6);

  return (
    Gesture.Pan()
      .enabled(enabled)
      // 제스처가 활성화되면 같은 자리의 버튼·숫자 누름이 취소됨
      .manualActivation(true)
      .onTouchesDown((event, manager) => {
        const touch = event.allTouches[0];
        if (!touch) return;

        grabbed.value = isOnHandle({ handleX: handle.x, handleY: handle.y, x: touch.x, y: touch.y, dotSize });
        dragged.value = minutes;
        if (!grabbed.value) manager.fail();
      })
      .onTouchesMove((_event, manager) => {
        if (grabbed.value) manager.activate();
      })
      .onUpdate((event) => {
        const next = minutesFromPoint({ centerX, centerY, x: event.x, y: event.y, previous: dragged.value, min, max });
        if (next === dragged.value) return;

        dragged.value = next;
        scheduleOnRN(onChange, next);
      })
  );
};
