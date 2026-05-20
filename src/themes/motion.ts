export const motion = {
  fast: 0.18,
  normal: 0.26,
  slow: 0.34,
  easeSpring: [0.17, 0.67, 0.19, 1.24] as const,
  easeSpringCss: "cubic-bezier(0.17, 0.67, 0.19, 1.24)",
} as const;

export const motionMs = {
  fast: `${motion.fast * 1000}ms`,
  normal: `${motion.normal * 1000}ms`,
  slow: `${motion.slow * 1000}ms`,
} as const;
