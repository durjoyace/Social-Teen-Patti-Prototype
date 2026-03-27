// Apple-style spring configs for Reanimated
export const APPLE_SPRING = { stiffness: 350, damping: 28 };
export const APPLE_SPRING_SNAPPY = { stiffness: 400, damping: 30 };
export const APPLE_SPRING_SOFT = { stiffness: 300, damping: 25 };

// Common animation durations
export const DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;
