import { type TimerMode } from '@/entities/timer';

type ColorModeInput = {
  /** 대기 여부 */
  editing: boolean;
  /** 대기에서 편집 중인 타이머 */
  editTarget: TimerMode;
};

/**
 * 호와 손잡이 색을 결정하는 타이머 모드
 *
 * @returns 휴식을 설정하는 중에만 휴식 색, 휴식 진행도 집중과 같은 색
 */
export const colorMode = ({ editing, editTarget }: ColorModeInput): TimerMode => {
  return editing && editTarget === 'rest' ? 'rest' : 'focus';
};
