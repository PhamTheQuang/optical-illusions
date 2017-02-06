function Contour(canvas) {
  this._initialize = function(canvas) {
    this._canvas = canvas;
    this._context = canvas.getContext('2d');
    this._width = canvas.width;
    this._height = canvas.height;
    this._radius = 1;
    this._level = 1;
    this._contourMap = Array(this._width * this._height);
    this.reset();
    this._bindEvent();
  }

  this._bindEvent = function() {
    this._canvas.addEventListener('mousedown', this._handleMouseDown.bind(this));
    this._canvas.addEventListener('mousemove', this._handleMouseMove.bind(this));
    this._canvas.addEventListener('mouseup', this._handleMouseUp.bind(this));
  }

  this._getPosition = function(obj) {
      var posX = obj.offsetLeft;
      var posY = obj.offsetTop;
      while (obj.offsetParent) {
          if (obj == document.getElementsByTagName('body')[0]) { break }
          else {
              posX = posX + obj.offsetParent.offsetLeft;
              posY = posY + obj.offsetParent.offsetTop;
              obj = obj.offsetParent;
          }
      }
      var posArray = [posX, posY]
      return posArray;
  }

  this._getEventPosition = function(event) {
    var x = 0;
    var y = 0;

    // Case 1: Chrome or IE
    if (event.x || event.y) {
        x = event.x;
        y = event.y;
        //Case 1.1: Chrome - decrease position of canvas
        if (navigator.userAgent.indexOf('Chrome') != -1) {
            var position = this._getPosition(this._canvas);
            x -= position[0];
            y -= position[1];
            x -= window.pageXOffset;
            y += window.pageYOffset;
        }
    }
    // Case 2: Firefox
    if (event.pageX || event.pageY) {
        x = event.pageX;
        y = event.pageY;
        var position = this._getPosition(this._canvas);
        x -= position[0];
        y -= position[1];
    }
    else {
        x = event.clientX + document.body.scrollLeft +
            document.documentElement.scrollLeft;
        y = event.clientY + document.body.scrollTop +
            document.documentElement.scrollTop;
        var position = this._getPosition(this._canvas);
        x -= position[0];
        y -= position[1];
    }
    return [x, y];
  }

  this._xyToLoc = function(x, y, w) {
    return y * w + x;
  }

  this._setPixelData = function(imageData, position, color) {
    for (var i = 0; i < 4; i++) {
      imageData[position + i] = color[i];
    }
  }

  this._addClick = function(x, y) {
    for (var ry = -this._radius + 1; ry < this._radius; ry++) {
      var ny = y + ry;
      if (ny < 0 || ny >= this._height) { continue; }
      for (var rx = 0; rx < this._radius - Math.abs(ry); rx++) {
        var nx = x - rx;
        if (nx < 0) { break; }
        this._contourMap[this._xyToLoc(nx, ny, this._width)] = this._level;
        console.log('L:' + nx + '-' + ny + '-' + this._level)
      }
      for (var rx = 0; rx < this._radius - Math.abs(ry); rx++) {
        var nx = x + rx;
        if (nx >= this._width) { break; }
        this._contourMap[this._xyToLoc(nx, ny, this._width)] = this._level;
        console.log('L:' + nx + '-' + ny + '-' + this._level)
      }
    }
  }

  this._redraw = function() {
    var imageData = this._context.createImageData(this._width, this._height);
    for (var y = 0; y < this._height; y++) {
      for (var x = 0; x < this._width; x++) {
        let level = this._contourMap[this._xyToLoc(x, y, this._width)]
        this._setPixelData(imageData.data, this._xyToLoc(x, y, this._width) * 4, [255 - level * 20, 255 - level * 20, 255 - level * 20, 255]);
      }
    }
    this._context.putImageData(imageData, 0, 0);
    this._drawingImage = imageData;
  }

  this._handleMouseDown = function(event) {
    this._paint = true;
    let position = this._getEventPosition(event);
    this._addClick(position[0], position[1]);
    this._redraw();
  }

  this._handleMouseMove = function(event) {
    if (this._paint) {
      let position = this._getEventPosition(event);
      this._addClick(position[0], position[1]);
      this._redraw();
    }
  }

  this._handleMouseUp = function(event) {
    this._paint = false;
  }

  this.reset = function() {
    this._contourMap.fill(0);
    this._redraw();
  }

  this.getContourMap = function() {
    return this._contourMap;
  }

  this._initialize(canvas);
}

function Stereogram(canvas, contourMap) {
  this._initialize = function(canvas, contourMap) {
    this._canvas = canvas;
    this._context = canvas.getContext('2d');
    this._width = this._canvas.width / 2;
    this._height = this._canvas.height;
    this._background = this._generateBackground();
    this._contourMap = contourMap;
  }

  this._randomColor = function() {
    let randomValue = function(max) {
      return Math.floor(Math.random() * max);
    }
    return [randomValue(255), randomValue(255), randomValue(255), 255]
  }

  this._setPixelData = function(imageData, position, color) {
    for (var i = 0; i < 4; i++) {
      imageData[position + i] = color[i];
    }
  }

  this._xyToLoc = function(x, y, w) {
    return y * w + x;
  }

  this._locToXy = function(loc, w) {
    return [loc % w, loc / w];
  }

  this._generateBackground = function() {
    var imageData = this._context.createImageData(this._width, this._height);
    for (var y = 0; y < this._height; y++) {
      for (var x = 0; x < this._width; x++) {
        this._setPixelData(imageData.data, this._xyToLoc(x, y, this._width) * 4, this._randomColor());
      }
    }
    return imageData;
  }

  this._stereogramColorAt = function(x, y, w, h) {
    let level = this._contourMap[this._xyToLoc(x, y, w)];
    let nx = x + level; //(level > 0 ? 1 : 0);
    let ny = y + level;
    if (nx >= w || ny >= h) {
      return this._randomColor();
    } else {
      let nloc = this._xyToLoc(nx, ny, w) * 4;
      let data = this._background.data;
      return data.slice(nloc, nloc + 4)
    }
  }

  this._generateStereogram = function() {
    let width2 = this._width * 2;
    var imageData = this._context.createImageData(width2, this._height);
    for (var y = 0; y < this._height; y++) {
      for (var x = 0; x < this._width; x++) {
        this._setPixelData(imageData.data, this._xyToLoc(x + this._width, y, width2) * 4, this._stereogramColorAt(x, y, this._width, this._height));
      }
    }
    return imageData;
  }

  this._redraw = function() {
    this._context.putImageData(this._background, 0, 0);
    this._context.putImageData(this._stereogram, 0, 0, this._width, 0, this._width, this._height);
  }

  this.getImageUrl = function() {
    return this._canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
  }

  this.reload = function() {
    this._stereogram = this._generateStereogram();
    this._redraw();
  }

  this._initialize(canvas, contourMap);
}

document.addEventListener('DOMContentLoaded', function() {
  contour = new Contour(document.getElementById('contour-canvas'));
  stereogram = new Stereogram(document.getElementById('stereogram-canvas'), contour.getContourMap());
  document.getElementById('clear-btn').addEventListener('click', contour.reset.bind(contour));
  document.getElementById('set-btn').addEventListener('click', function() {
    let radius = parseInt(document.getElementById('input-size').value);
    let level = parseInt(document.getElementById('input-level').value);
    contour._radius = radius;
    contour._level = level;
  });
});