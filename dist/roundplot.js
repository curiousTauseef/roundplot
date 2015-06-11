"use strict";

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

function RoundPlot() {
  var params = arguments[0] === undefined ? {} : arguments[0];

  this.clockRadius = params.clockRadius || 100;
  this.size = params.size || 500;
  this.alpha0 = params.alpha0 || 0;
  this.svg = d3.select(params.target + " svg");
  if (this.svg.node() === null) this.svg = this.createSVG(params.target, this.size);
  this.addHandlers();
  if (params.dateFormat) this.dateFormat = params.dateFormat;
  if (params.valueFormat) this.valueFormat = params.valueFormat;
  if (params.valueToColor) this.valueToColor = params.valueToColor;
  this.timeInClock = params.timeInClock || 12 * 60 * 60 * 1000; // Default to 12 hours in the clock
  this.setData(params.data);
}

RoundPlot.prototype = {
  scale: function scale(x) {
    return this.clockRadius + this.data.norm(x) * (this.size / 2 - this.clockRadius);
  },
  setData: function setData() {
    var rawData = arguments[0] === undefined ? [] : arguments[0];
    var moveCursor = arguments[1] === undefined ? rawData.length !== 0 : arguments[1];
    return (function () {
      this.data = new RoundPlot.Data(rawData);
      this.d0 = rawData.length > 0 ? rawData[0].date.getTime() : 0;
      if (moveCursor) this.moveCursor(this.data.last());
      this.paint();
    }).apply(this, arguments);
  },
  dateToAngle: function dateToAngle(d) {
    //Returns an angle in degrees
    return this.alpha0 + (d - this.d0) * 360 / this.timeInClock;
  },
  dateFormat: function dateFormat(d) {
    var pad = function pad(n) {
      return ("0" + n).slice(-2);
    };
    var day = d.getDay(),
        month = d.getMonth(),
        h = d.getHours(),
        m = d.getMinutes();
    return "" + pad(day) + "/" + pad(month + 1) + " " + pad(h) + ":" + pad(m);
  },
  valueFormat: function valueFormat(v) {
    return v.valueOf().toFixed(0);
  },
  valueToColor: function valueToColor(v) {
    var r = this.data.norm(v.valueOf());
    return d3.rgb(255 * r, 255 * (1 - r), 0);
  },
  createSVG: function createSVG(target, size) {
    var middle = this.size / 2,
        radius = this.clockRadius,
        lineHeight = radius / 5;
    return d3.select(target).html("\n      <svg width=\"" + size + "\" height=\"" + size + "\">\n        <style>\n          #cursor{\n            stroke : #999;\n          }\n          #legend > text {\n            text-anchor: middle;\n            font-size: 20;\n            font-family: mono;\n          }\n          #dateLegend {\n            fill: #999;\n          }\n          .valueBar {\n            stroke-dasharray: 5,1;\n            stroke-width: 2;\n          }\n          .circ {\n            fill: none;\n          }\n        </style>\n        <line id=\"cursor\"\n              x1=\"" + size / 2 + "\" y1=\"" + (size / 2 - this.clockRadius + 10) + "\"\n              x2=\"" + size / 2 + "\" y2=\"0\"></line>\n        <g id=\"legend\">\n          <text id=\"dateLegend\"\n                x=\"" + size / 2 + "\" y=\"" + (middle - radius / 2 + lineHeight) + "\"></text>\n          <text id=\"valueLegend\"\n                x=\"" + size / 2 + "\" y=\"" + (middle + radius / 2 - lineHeight) + "\"></text>\n        </g>\n      </svg>\n    ").select("svg");
  },
  paintValueBars: function paintValueBars() {
    var _this = this;

    var last = this.data.last();
    var paintingData = this.data.raw.filter(function (d) {
      return last.date - d.date < _this.timeInClock;
    });
    var valueBars = this.svg.selectAll("line.valueBar").data(paintingData);
    var s = this.size,
        m = s / 2,
        r = this.clockRadius;
    valueBars.enter().append("line").attr("class", "valueBar").attr("id", function (d) {
      return "datum-" + d.date;
    }).attr("x1", m).attr("y1", m - r).attr("x2", m);
    valueBars.attr("transform", function (d) {
      var alpha = _this.dateToAngle(d.date);
      return "rotate(" + alpha + ", " + m + ", " + m + ")";
    });
    valueBars.transition().attr("y2", function (d) {
      return m - _this.scale(d.value);
    }).attr("stroke", function (d) {
      return _this.valueToColor(d.value);
    });
    valueBars.exit().remove();
  },
  paintCircs: function paintCircs() {
    var m = this.size / 2,
        min = this.clockRadius,
        max = this.size / 2;
    var circs = this.svg.selectAll("circle.circ").data([min, (min + max) / 2, max]);
    circs.enter().append("circle").attr("class", "circ");
    circs.attr("cx", m).attr("cy", m).attr("r", function (d) {
      return d;
    }).attr("stroke", function (d) {
      return d3.rgb((d - min) / (max - min) * 255, 80, 80);
    });
  },
  paint: function paint() {
    this.paintValueBars();
    this.paintCircs();
  },
  moveCursor: function moveCursor(datum) {
    var angle = this.dateToAngle(datum.date) * Math.PI / 180 - Math.PI / 2;
    var r = this.clockRadius,
        m = this.size / 2;
    this.svg.select("#cursor").attr("x1", m + Math.cos(angle) * (r - 10)).attr("y1", m + Math.sin(angle) * (r - 10)).attr("x2", m + Math.cos(angle) * m).attr("y2", m + Math.sin(angle) * m);
    this.svg.select("#dateLegend").text(this.dateFormat(datum.date));
    this.svg.select("#valueLegend").text(this.valueFormat(datum.value)).transition().attr("fill", this.valueToColor(datum.value));
  },
  addHandlers: function addHandlers() {
    var _this2 = this;

    this.svg.on("mousemove", function () {
      var _d3$mouse = d3.mouse(_this2.svg.node());

      var _d3$mouse2 = _slicedToArray(_d3$mouse, 2);

      var x = _d3$mouse2[0];
      var y = _d3$mouse2[1];

      var m = _this2.size / 2;
      var angle = Math.atan2(x - m, m - y) * 180 / Math.PI;
      var dist = function dist(d) {
        return (Math.abs(_this2.dateToAngle(d.date) - angle) + 360) % 360;
      };
      var datum = _this2.data.raw.reduce(function (p, c) {
        return dist(p) < dist(c) ? p : c;
      });
      _this2.moveCursor(datum);
    });
    this.svg.on("click", function () {
      return d3.event.preventDefault() && false;
    });
  }
};

RoundPlot.Data = function Data() {
  var raw = arguments[0] === undefined ? [] : arguments[0];

  if (raw.length !== 0) {
    this.raw = raw;

    var _raw$reduce = this.raw.reduce(function (prev, cur) {
      if (cur.value < prev[0]) prev[0] = cur.value;
      if (cur.value > prev[1]) prev[1] = cur.value;
      return prev;
    }, [Infinity, -Infinity]);

    var _raw$reduce2 = _slicedToArray(_raw$reduce, 2);

    this.min = _raw$reduce2[0];
    this.max = _raw$reduce2[1];
  } else {
    this.raw = raw, this.min = this.max = 0;
  }
};
RoundPlot.Data.prototype = {
  norm: function norm(x) {
    return (x - this.min) / (this.max - this.min);
  },
  first: function first() {
    return this.raw[0];
  },
  last: function last() {
    return this.raw[this.raw.length - 1];
  }
};