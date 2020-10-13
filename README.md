# p5.bezier

![cover](img/cover.jpg)

Hi! Don't wait and let **p5.bezier**, a [p5.js](https://p5js.org) library, help you draw the smoothest curves like never before. You can regard the library as an advanced version of the original p5.js `bezier()` function which takes no less or more than 4 points while cannot draw higher level curves. The p5.bezier library allows you to draw continuous and closed Bézier curves easily.

**0.2.0 NEW** The library is now independent of p5.js so that you can use it for a wider range of projects (untested). However, an extra `initBezier(canvas)` line is needed before the drawings.

To draw a Bézier curve on canvas, you can simply use `newBezier()`:

```js
newBezier([
  [85, 20],
  [10, 10],
  [90, 90],
  [15, 80],
  [20, 100],
])
```

**What is Bézier Curve?**

A Bézier curve is a parametric curve used in computer graphics and related fields. The curve, which is related to the Bernstein polynomial, is named after Pierre Bézier, who used it in the 1960s for designing curves for the bodywork of Renault cars. Its continuity creates beautiful textures and shapes. Nowadays, it is an essential part across design domains from products to visualization.

Dive into this document to know more about the library.

## Getting Started

To use p5.bezier library, download [p5.bezier.js](https://raw.githubusercontent.com/peilingjiang/p5.bezier/master/src/p5.bezier.js) file into your project directory and add the following line into the your HTML file:

```HTML
<script src="p5.bezier.js"></script>
```

You can also use the file through content delivery service by adding the following line:

```HTML
<script src="https://unpkg.com/p5bezier@0.2.4/lib/p5.bezier.min.js"></script>
```

The library is still a work-in-progress project. Therefore, code tends to change from time to time. Please come back once a while to download the latest version of the library.

### NPM

You can also install using the package manager NPM (recommended):

```
npm install --save p5bezier
```

And then import the modules into your project:

```js
import { initBezier, newBezier, newBezierObject } from 'p5bezier'
```

## Init for Bézier

**0.2.0 NEW** You need to let the Bézier drawing system know the canvas you are drawing on. Let's use p5.js as an example:

```diff
function setup() {
  let c = createCanvas(100, 100)
+ initBezier(c)
}
```

## Draw a Bézier Curve

The most straightforward and easiest way to use the library is to put `newBezier()` in your `draw()` function. To control the style of the curve, use `fill()` or `strokeWeight()` functions as for other shapes.

```
newBezier(pointsArray [, closeType] [, fidelity]);
```

**pointsArray**

Takes an array of arrays of _x_ and _y_ locations of control points of the curve. e.g. `[[10, 30], [5, 100], [25, 60]]`.

**closeType** (Optional)

Takes a string, either `"OPEN"` or `"CLOSE"`. If you want the curve to close itself automatically, put `"CLOSE"` here. Otherwise, leave it as default or put `"OPEN"`. Currently, the close point of the curve cannot guarantee to be continuous.

**fidelity** (Optional)

Takes an integer from `0` to `10`, as default is `7`. How accurate you want the Bézier curve to be. The more inner vertices used to draw the curve, the more accurate it would be, however, the more computation would also be cost.

## Create a Bézier Object

If you want higher-level functions of a Bézier curve, like getting the shortest distance from a point to the curve, you can use `newBezierObj()`. It can also potentially save computation resources (when you put it in `setup()`) since the vertices will only be calculated once and then can be used repeatedly.

The use of it is similar to the previous one, while `newBezierObj()` will return a _Bézier Curve Object_ that you can pass into a variable:

```
let bezierObject = newBezierObj(pointsArray [, closeType] [, fidelity]);
```

The call of `newBezierObj` will not draw the curve on canvas automatically. To draw the curve, use `.draw()` as one of many functions listed below:

- `.draw([dash])`

  Draw the curve on canvas.

  **dash** (Optional)

  Takes an array of two numbers indicating the length of solid and break parts in one period of the dash Bézier curve. e.g. `[10, 5]` means the first solid part is 10px long and then comes the break part which is 5px long.

- `.update(newPointsArray)`

  Update the locations of control points. The amount of control points must be the same as the time curve was created.

- `.move(x, y [, z, toDraw, dash])`

  Alternatively, if you want to move the curve as a whole, you can use this function. The function will not mutate the original object but will draw and return a new one. Therefore, if you want to update the curve this way (which is faster than `.update()`), you can:

  ```js
  bezierObject = bezierObject.move(6, 17, -22, false)
  ```

  `toDraw` is `true` by default, but if you only want to update the curve while not drawing it simultaneously, you can set it to `false`.

- `.shortest(pointX, pointY [, pointZ])`

  Takes two numbers of _x_ and _y_ locations of an outside point. Returns an array of location of the point on the curve. e.g. To draw a line between this two points:

  ```js
  pointOnCurve = bezierObject.shortest(pointX, pointY)
  line(pointX, pointY, pointOnCurve[0], pointOnCurve[1])
  ```

## Examples

To run the examples locally, please download the repository on your computer. Then, use Terminal and change directory to `examples` folder. Run

```
npm install
node server.js name_of_example
```

For instance, if you want to run the example _basic_, simply type `node server.js basic`. Then, go to the browser of your choice and put `localhost:8000` in the address bar.

Currently available examples:

- **basic** draws a simple Bézier curve with 5 control points across the canvas.
- **control_points** draws a curve and it's control points, which can be dragged around.
- **fidelity** draws curves with different fidelities.
- **basic_object** is similar to basic, while drew with Bézier object.
- **shortest_point** draws the shortest line from mouse to curve.

More complex examples to be updated.

## To-Dos

1. More examples.
2. `offset()`, `intersection()`, and `curvature()`... functions for Bézier object.
3. Draw B-splines.
4. Continuous close point when close up a Bézier curve.

## References

1. [Bézier curve - Wikipedia](https://en.wikipedia.org/wiki/B%C3%A9zier_curve)
2. [Bezier.js](https://pomax.github.io/bezierjs/) by [Pomax - GitHub](https://github.com/Pomax) (Concept)
