export declare const MAX_DEGREE = 160;
export type Smoothness = 1 | 2 | 3 | 4 | 5;
export declare const _smoothness: {
    [A in Smoothness]: number;
};
export declare function _binomialCoefficient(n: number, i: number): number;
