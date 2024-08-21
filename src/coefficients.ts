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

const _calculatedFactorials: number[] = [1]

const _binomialCoefficients: {
  [n: number]: {
    [i: number]: number
  }
} = {}

/* -------------------------------------------------------------------------- */

function _helper_ensureFactorials(n: number): void {
  const prevLen = _calculatedFactorials.length

  for (let i = prevLen; i <= n; i++)
    _calculatedFactorials[i] = i * _calculatedFactorials[i - 1]
}

function _f(i: number): number {
  return _calculatedFactorials[i]
}

/* -------------------------------------------------------------------------- */

function _helper_ensureBinomialCoefficients(_n: number): void {
  for (let n = 2; n <= _n; n++) {
    _binomialCoefficients[n] = {}

    for (let i = 1; i < n; i++) {
      _binomialCoefficients[n][i] = _f(n) / (_f(i) * _f(n - i))
    }
  }
}

export function _binomialCoefficient(n: number, i: number): number {
  if (i === 0 || i === n) return 1
  return _binomialCoefficients[n][i]
}

/* -------------------------------------------------------------------------- */

_helper_ensureFactorials(MAX_DEGREE + 1)
_helper_ensureBinomialCoefficients(MAX_DEGREE + 1)
