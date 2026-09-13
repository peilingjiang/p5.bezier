import { type Smoothness } from './coefficients';
import { type BezierCanvas, type CloseType, type Dimension, type PointList, type Vertex, type VertexList } from './utils';
declare class P5Bezier {
    private b;
    private points;
    private vertices;
    private increment;
    constructor(canvas: any);
    draw(pointList: PointList, closeType?: CloseType, smoothness?: Smoothness): PointList;
    new(pointList: PointList, closeType?: CloseType, smoothness?: Smoothness): BezierCurve;
}
declare function initBezier(canvas: any): P5Bezier;
declare class BezierCurve {
    controlPoints: PointList;
    closeType: CloseType;
    dimension: Dimension;
    increment: number;
    private vertexList;
    private sampledPoints;
    private sampledIncrement;
    private b;
    constructor(points: PointList, closeType: CloseType, increment: number, bezierCanvas: BezierCanvas, vertexList?: VertexList | null);
    private _buildVertexList;
    draw(dash?: [number, number]): void;
    private _dashedCurve;
    update(newControlPointList: PointList): void;
    move(x: number, y: number, z?: number | null, toDraw?: boolean, dash?: [number, number]): BezierCurve;
    shortest(pX: number, pY: number, pZ?: number): Vertex;
}
export default initBezier;
