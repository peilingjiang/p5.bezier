export const MAX_DEGREE = 160

// smoothness 1 - 5, default 3
export type Smoothness = 1 | 2 | 3 | 4 | 5
export const _smoothness: {
  [A in Smoothness]: number
} = {
  1: 0.1,
  2: 0.02,
  3: 0.001,
  4: 0.0005,
  5: 0.0002,
}
