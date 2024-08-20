type Accuracy = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type CloseType = 'OPEN' | 'CLOSE';
type Dimension = 2 | 3;
type Point = [number, number] | [number, number, number];
type PointList = Point[];
type Vertex = [number, number] | [number, number, number];
type VertexList = Vertex[];
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
    update(newControlPointList: PointList): void;
    move(x: number, y: number, z?: number | null, toDraw?: boolean, dash?: [number, number]): BezierCurve;
    shortest(pX: number, pY: number, pZ?: number): Vertex;
}
export { initBezier as init, newBezier as draw, newBezierObj as new };
