import { type Accuracy } from './coefficients';
import { type CloseType, type Dimension, type PointList, type Vertex, type VertexList } from './utils';
declare function initBezier(canvas: any): void;
declare function newBezier(pointList: PointList, closeType?: CloseType, accuracy?: Accuracy): void;
declare function newBezierObj(pointList: PointList, closeType?: CloseType, accuracy?: Accuracy): BezierCurve;
declare class BezierCurve {
    controlPoints: PointList;
    closeType: CloseType;
    dimension: Dimension;
    increment: number;
    private vertexList;
    private p;
    private n;
    constructor(points: PointList, closeType: CloseType, increment: number, dimension: Dimension, vertexList?: VertexList | null);
    private _buildVertexList;
    private _addVertex;
    private _distVertex;
    draw(dash?: [number, number]): void;
    private _solidCurve;
    private _dashedCurve;
    update(newControlPointList: PointList): void;
    move(x: number, y: number, z?: number | null, toDraw?: boolean, dash?: [number, number]): BezierCurve;
    shortest(pX: number, pY: number, pZ?: number): Vertex;
}
declare const p5bezier: {
    init: typeof initBezier;
    draw: typeof newBezier;
    new: typeof newBezierObj;
};
export { initBezier as init, newBezier as draw, newBezierObj as new };
export default p5bezier;
