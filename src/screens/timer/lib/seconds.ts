export const millisecondsToSeconds = (ms: number): number => {
  'worklet';
  return Math.max(0, Math.ceil(ms / 1000));
};
