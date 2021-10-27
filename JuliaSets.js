let viewport;

let render;

let c;
let autoZoom;
let maxIter;
let hueOffset;

let autoZoomPoint;
let movePoint = -1;
let isCMoving = false;
let hasMoved = false;

document.oncontextmenu = function() {
  return false;
}

function setup() {
  render = new GPU().createKernel(function(v1x, v1y, v2x, v2y, ca, cb, maxIter, hueOffset) {
    this.color(0, 0, 0, 1);

    let za = v1x+(v2x-v1x)*this.thread.x/this.constants.w; //Equivalent to map(x, 0, width, viewport[0].x, viewport[1].x)
    let zb = v1y+(v2y-v1y)*this.thread.y/this.constants.h; //Equivalent to map(y, 0, height, viewport[0].y, viewport[1].y) (HERE THE ORIGIN IS AT THE BOTTOM LEFT)
    for(let n = 0; n<maxIter; n++){
      //z = z^2 + c = (a+ib)^2 + c = a^2 - b^2 + 2abi + c
      let aa = za**2-zb**2;
      let bb = 2*za*zb;
      za = aa + ca;
      zb = bb + cb;
       
      //Not in Mandelbrot set if |z| > 2
      if(za**2+zb**2 > 4){
        //HSV TO RGB CONVERSION
        let H = (n/maxIter*359+hueOffset)%360;
        let X = 1-Math.abs(H/60%2-1);
        if(H < 60) this.color(1, X, 0, 1);
        else if(H < 120) this.color(X, 1, 0, 1);
        else if(H < 180) this.color(0, 1, X, 1);
        else if(H < 240) this.color(0, X, 1, 1);
        else if(H < 300) this.color(X, 0, 1, 1);
        else this.color(1, 0, X, 1);
        break;
      }
    }
  }).setOutput([windowWidth, windowHeight]).setConstants({w: windowWidth, h: windowHeight}).setGraphical(true);
  
  let canvas = render.canvas;
  document.getElementsByTagName("body")[0].appendChild(canvas);
  canvas.style.position = "absolute";
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.zIndex = -1;
  
  createCanvas(windowWidth, windowHeight);
  
  autoZoom = createSlider(-10, 10, 0);
  autoZoom.position(67, height-20);
  maxIter = createSlider(2, 1000, 100);
  maxIter.position(322, height-20);
  hueOffset = createSlider(0, 359, 0);
  hueOffset.position(550, height-20);
  
  viewport = [createVector(-1.8, -1.3), createVector(1.8, 1.3)];
  c = createVector(0.33157894736842075, -0.4016393442622951);
  autoZoomPoint = createVector(0.2728034805184283, -0.10724048133910033);
}

function draw() {
  clear();
  fill(255);
  noStroke();
  textAlign(LEFT, BASELINE);
  textSize(12);
  text("Auto Zoom", 5, height-6);
  text(autoZoom.value()/1000, 202, height-6);
  text("Max Iterations", 245, height-6);
  text(maxIter.value(), 456, height-6);
  text("Hue Offset", 491, height-6);
  text(hueOffset.value()+"°", 686, height-6);
  
  textAlign(RIGHT, BASELINE);
  text("Auto Zoom Point: " + autoZoomPoint.x + (autoZoomPoint.y > 0 ? " + " : " - ") + abs(autoZoomPoint.y) + "i", width-3, height-6);
  text("C Point: " + c.x + (c.y > 0 ? " + " : " - ") + abs(c.y) + "i", width-3, height-20);

  let cScreen = complexToScreenPoint(c.x, c.y);
  strokeWeight(15);
  stroke(255);
  point(cScreen.x, cScreen.y);
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(24);
  text("c", cScreen.x, cScreen.y);

  if(movePoint == -1 && !isCMoving) zoomAt(autoZoomPoint, autoZoom.value()/1000);
  render(viewport[0].x, viewport[0].y, viewport[1].x, viewport[1].y, c.x, c.y, maxIter.value(), hueOffset.value());
}

function mouseWheel(e){
  zoomAt(screenPointToComplex(mouseX, mouseY), -e.delta/1000); 
}

function mousePressed(){
  if(mouseY > height-35) return;
  let cScreen = complexToScreenPoint(c.x, c.y);
  if(p5.Vector.sub(cScreen, createVector(mouseX, mouseY)).mag() < 15){
    isCMoving = true;
  }
  else movePoint = screenPointToComplex(mouseX, mouseY);
}

function mouseReleased(e){
  if(mouseY > height-35) return;
  if(e.button == 0){ //LEFT
    if(!hasMoved && !isCMoving){
      c = screenPointToComplex(mouseX, mouseY);
    }
  }else if(e.button == 2){ //RIGHT
    autoZoomPoint = screenPointToComplex(mouseX, mouseY);
  }
  isCMoving = false
  movePoint = -1;
  hasMoved = false;
}

function mouseDragged(){
  if(isCMoving){
    c = screenPointToComplex(mouseX, mouseY);
  }
  else if(movePoint != -1){
    let mousePoint = screenPointToComplex(mouseX, mouseY);
    let delta = p5.Vector.sub(mousePoint, movePoint);
    viewport[0].sub(delta);
    viewport[1].sub(delta);
    movePoint = screenPointToComplex(mouseX, mouseY);
    hasMoved = true;
  }
}

function screenPointToComplex(x, y){
  return createVector(map(x, 0, width, viewport[0].x, viewport[1].x), map(height-y, 0, height, viewport[0].y, viewport[1].y)); 
}

function complexToScreenPoint(a, b){
  return createVector(map(a, viewport[0].x, viewport[1].x, 0, width), height-map(b, viewport[0].y, viewport[1].y, 0, height));
}

function zoomAt(zoomPoint, zoomFactor){
  //Translate viewport so that the zoom point is at the origin
  viewport[0].sub(zoomPoint);
  viewport[1].sub(zoomPoint);
  //Scale the viewport
  viewport[0].mult(1-zoomFactor);
  viewport[1].mult(1-zoomFactor);
  //Translate back to the original position
  viewport[0].add(zoomPoint);
  viewport[1].add(zoomPoint);
}
