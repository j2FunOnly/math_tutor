'use strict';

var app = {};

app.svg = {};

app.svg.Path = function() {
  this.path = [];
}

app.svg.Path.prototype.toString = function() {
  return this.path.join(' ');
}

app.svg.Path.prototype.M = function(x, y) {
  this.path = this.path.concat(['M', x, y]);
  return this;
}

app.svg.Path.prototype.L = function(x, y) {
  this.path = this.path.concat(['L', x, y]);
  return this;
}

app.svg.Path.prototype.Q = function(cx, cy, x, y) {
  this.path = this.path.concat(['Q', cx, cy, x, y]);
  return this;
}

app.svg.SVG = function(params) {
  this.ns = 'http://www.w3.org/2000/svg';
  this.svg = document.querySelector(params.selector);
  this.axis = params.axis;

  var defs = document.createElementNS(this.ns, 'defs');

  var arrow = document.createElementNS(this.ns, 'marker');
  var arrowAttrs = {
    id: 'arrow',
    markerWidth: 10,
    markerHeight: 10,
    orient: 'auto',
    markerUnits: 'strokeWidth',
    refX: 8,
    refY: 2,
  }
  this.setAttributes(arrow, arrowAttrs)

  var arrowPath = document.createElementNS(this.ns, 'path');
  var arrowPathAttrs = {
    stroke: 'red',
    'stroke-width': 1,
    'fill-opacity': 0,
    d: new app.svg.Path().M(0, 0).L(8, 2).L(0, 4).toString()
  }
  this.setAttributes(arrowPath, arrowPathAttrs);

  arrow.appendChild(arrowPath);
  defs.appendChild(arrow)
  this.svg.appendChild(defs);

  this.svgMain = document.createElementNS(this.ns, 'g');
  this.svgMain.setAttribute('id', 'svg-main');
  this.svg.appendChild(this.svgMain);
}

app.svg.SVG.prototype.setAttributes = function(el, attrs) {
  for (var k in attrs) el.setAttribute(k, attrs[k]);
}

app.svg.SVG.prototype.getMiddlePoint = function(el) {
  return el.getPointAtLength(el.getTotalLength() / 2);
}

app.svg.SVG.prototype.width = function() {
  return this.svg.width.baseVal.value;
}

app.svg.SVG.prototype.clear = function() {
  var emptyGroup = this.svgMain.cloneNode(false);
  this.svg.replaceChild(emptyGroup, this.svgMain);
  this.svgMain = emptyGroup;
}

app.svg.SVG.prototype.drawQ = function(start, end) {
  var qStart = this.axis.x + start * this.axis.step;
  var qDistance = this.axis.step * (end - start);
  var qEnd = qStart + qDistance;
  var qCx = qStart + qDistance / 2;
  var qCy = this.axis.y - qDistance / 2;

  var q = document.createElementNS(this.ns, 'path');
  var qAttrs = {
    stroke: 'red',
    'stroke-width': 1,
    'fill-opacity': 0,
    'marker-end': 'url(#arrow)',
    d: new app.svg.Path()
      .M(qStart, this.axis.y)
      .Q(qCx, qCy, qEnd, this.axis.y)
      .toString()
  }
  this.setAttributes(q, qAttrs);
  this.svgMain.appendChild(q);
  return q;
}

app.svg.SVG.prototype.text = function(str, params) {
  var text = document.createElementNS(this.ns, 'text');
  var attrs = {
    'text-anchor': 'middle',
    fill: 'black',
    'font-size': 16
  }
  this.setAttributes(text, attrs);
  this.setAttributes(text, params);
  text.textContent = str;
  this.svgMain.appendChild(text);
  return text;
}

app.Task = function(a, b) {
  this.a = a;
  this.b = b;
  this.errors = {};
}

app.Task.prototype.isValid = function() {
  return (this.a >= 6 && this.a <= 9) &&
    (this.result() >= 11 && this.result() <= 14);
}

app.Task.prototype.result = function() {
  return this.a + this.b;
}

app.Task.prototype.toString = function() {
  return [
    this.a,
    '+',
    this.b,
    '= '
  ].join(' ');
}

app.Task.prototype.toHTML = function() {
  return [
    '<span class="' + (this.errors.a ? 'error' : '') + '">',
    this.a,
    '</span> + ',
    '<span class="' + (this.errors.b ? 'error' : '') + '">',
    this.b,
    '</span> = '
  ].join('');
}

app.Task.prototype.check = function(k, task) {
  var result = this[k] == task[k];
  this.errors[k] = !result;
  return result;
}

app.Task.prototype.equal = function(task) {
  return this.a == task.a && this.b == task.b;
}

app.View = function(params) {
  this.svg = params.svg;
  this.container = document.querySelector(params.container);
  this.elements = {};
  this.elements.title = this.container.querySelector('h3.title');

  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'input hidden';
  input.value = '';
  this.container.appendChild(input);
  this.elements.input = input;

  input.addEventListener('input', function() {
    if (!this.ctrl.isValidNumber(input.value, this.step)) {
      input.classList.add('error');
      this.elements.title.innerHTML = this.ctrl.task.toHTML() + '?';
    }
  }.bind(this));
}

app.View.prototype.render = function(ctrl, step) {
  this.step = step;
  this.ctrl = ctrl;
  this[step]();
}

app.View.prototype.firstStep = function() {
  var task = this.ctrl.task;
  var input = this.elements.input;

  input.className = 'input';
  input.focus();

  this.svg.clear();

  var title = this.elements.title;
  title.className = 'title';
  title.innerHTML = task.toHTML() + '?';

  var arc = this.elements.arc1 = this.svg.drawQ(0, task.a);
  this.moveInputTo(arc);
}

app.View.prototype.secondStep = function() {
  var task = this.ctrl.task;
  var input = this.elements.input;

  this.elements.title.innerHTML = task.toHTML() + '?';

  this.setArcTitle(this.elements.arc1);

  var arc = this.elements.arc2 = this.svg.drawQ(task.a, task.result());
  this.moveInputTo(arc);
}

app.View.prototype.thirdStep = function() {
  var task = this.ctrl.task;
  var input = this.elements.input;

  this.elements.title.innerHTML = task.toHTML() + '?';

  this.setArcTitle(this.elements.arc2);
  this.moveInputToTitle();
}

app.View.prototype.solved = function() {
  this.elements.input.classList.add('hidden');

  var task = this.ctrl.task;
  var title = this.elements.title;
  title.innerHTML = task.toHTML() + task.result();
  title.classList.add('solved');
}

app.View.prototype.setArcTitle = function(arc) {
  var midPoint = this.svg.getMiddlePoint(arc);
  var input = this.elements.input;

  this.svg.text(input.value, {
    x: midPoint.x,
    y: midPoint.y - 5
  });
}

app.View.prototype.moveInputTo = function(arc) {
  var input = this.elements.input;
  var midPoint = this.svg.getMiddlePoint(arc);

  input.value = '';
  input.classList.remove('error');
  input.style.left = midPoint.x - 8 + 'px';
  input.style.top = midPoint.y - 23 + 'px';
}

app.View.prototype.moveInputToTitle = function () {
  var input = this.elements.input;

  input.value = '';
  input.classList.remove('error');
  input.classList.add('title');
  input.style.left = '270px';
  input.style.top = 50 - 28 + 'px';
}

app.Tutor = function(params) {
  this.task = params.task;
  this.view = params.view;
  this.solution = new app.Task();
}

app.Tutor.prototype.start = function() {
  if (!this.task.isValid()) {
    throw new Error('The task [' + this.task.toString() + '] is invalid!');
  }

  this.view.render(this, 'firstStep');
}

app.Tutor.prototype.isValidNumber = function(number, step) {
  var result;

  switch (step) {
    case 'firstStep':
      this.solution.a = parseInt(number, 10);
      result = this.task.check('a', this.solution);
      if (result) this.view.render(this, 'secondStep');
      break;
    case 'secondStep':
      this.solution.b = parseInt(number, 10);
      result = this.task.check('b', this.solution);
      if (result) this.view.render(this, 'thirdStep');
      break;
    case 'thirdStep':
      var answer = parseInt(number, 10);
      result = this.task.equal(this.solution) && this.task.result() == answer;
      if (result) this.view.render(this, 'solved');
      break;
    default:
      result = false;
  }
  return result;
}

var axis = {
  x: 34,
  y: 311,
  step: 19
}

var view = new app.View({
  svg: new app.svg.SVG({
    selector: '#svg',
    axis: axis
  }),
  container: '.container'
});

var tutor = new app.Tutor({
  view: view
});

document.querySelector('button#new-task').addEventListener('click', function() {
  var a = 6 + Math.floor(Math.random() * 4);
  var sum = 11 + Math.floor(Math.random() * 4);
  tutor.task = new app.Task(a, sum - a);
  tutor.start();
});
