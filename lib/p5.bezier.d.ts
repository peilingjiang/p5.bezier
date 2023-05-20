export declare function initBezier(canvas: any, strictMode?: boolean): void;
export declare function newBezier(pointList: number[][], closeType?: string, accuracy?: number): void;
export declare function newBezierObj(pointList: Array<Array<number>>, closeType?: string, accuracy?: number): BezierCurve;
declare class BezierCurve {
    controlPoints: any[];
    closeType: string;
    dimension: number;
    increment: number;
    vertexList: any[];
    vertexListLen: number;
    p: number;
    n: number;
    constructor(pL: any[], closeT: string, tI: number, bD: number, vL?: any[] | null);
    private _buildVertexList;
    private _addVertex;
    private _distVertex;
    draw(dash?: number[]): void;
    update(newControlList: number[][]): void;
    move(x: number, y: number, z?: number | null, toDraw?: boolean, dash?: number[]): BezierCurve;
    shortest(pX: number, pY: number, pZ?: number): number[];
}
export {};
