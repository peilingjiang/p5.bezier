/*
  p5.bezier.js fidelity example
  Peiling Jiang
  NYU ITP/IMA 2020

  Color templet from colorhunt.co
*/

let points = [[0, 0], [100, 1100], [1500, -2200], [1500, 2800], [100, -500], [0, 600]];

function setup() {
  createCanvas(1000, 600);
  noFill();
}

function draw() {
  background(235);
  strokeWeight(2);
  stroke(color("#FFB99A"));
  newBezier(points, "OPEN", 0);
  stroke(color("#FF6464"));
  newBezier(points, "OPEN", 1);
  stroke(color("#DB3056"));
  newBezier(points, "OPEN", 4);
  stroke(color("#851D41"));
  newBezier(points, "OPEN", 9);

  // Caption
  push();
  noStroke();
  fill(color("#FFB99A"));
  text("Fidelity 0", 935, 540);
  fill(color("#FF6464"));
  text("Fidelity 1", 935, 555);
  fill(color("#DB3056"));
  text("Fidelity 4", 935, 570);
  fill(color("#851D41"));
  text("Fidelity 9", 935, 585);
  pop();
}
