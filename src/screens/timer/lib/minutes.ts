import { MINUTE_IN_MS } from '@/entities/timer';

export const millisecondsToMinutes = (ms: number): number => {
  'worklet';
  return Math.max(0, ms / MINUTE_IN_MS);
};
