/** Seconds. Short feedback must never delay a server command or its result. */
export const motionTiming = {
  feedback: 0.16,
  state: 0.24,
  entrance: 0.32,
  reveal: 0.32,
  stagger: 0.06,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};
