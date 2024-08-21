export declare const MAX_DEGREE = 160;
export type Accuracy = 1 | 2 | 3 | 4 | 5;
export declare const _accuracies: {
    [A in Accuracy]: number;
};
export declare function _binomialCoefficient(n: number, i: number): number;
