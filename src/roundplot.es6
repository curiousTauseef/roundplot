function RoundPlot(params={}) {
  this.clockRadius = params.clockRadius || 100;
  this.size = params.size || 500;
  this.alpha0 = params.alpha0 || 0;
  this.svg = d3.select(params.target+" svg");
  if (this.svg.node() === null) this.svg = this.createSVG(params.target, this.size); 
  this.addHandlers();
  if (params.dateFormat) this.dateFormat = params.dateFormat;
  if (params.valueToColor) this.valueToColor = params.valueToColor;
  this.timeInClock = params.timeInClock || 12 * 60 * 60 * 1000; // Default to 12 hours in the clock
  this.setData(params.data);
}

RoundPlot.prototype = {
  scale(x) {
    return this.clockRadius + this.data.norm(x) * (this.size/2 - this.clockRadius);
  },
  setData(rawData, moveCursor=(rawData.length !== 0)) {
    this.data = new RoundPlot.Data(rawData);
    this.d0 = (rawData.length>0)? rawData[0].date.getTime() : 0;
    if (moveCursor) this.moveCursor(this.data.last());
    this.paint();
  },
  dateToAngle(d) { //Returns an angle in degrees
    return this.alpha0 + (d - this.d0) * 360 / this.timeInClock;
  },
  dateFormat(d) {
    const pad = n => ('0'+n).slice(-2);
    const day = d.getDay(), month = d.getMonth(), h = d.getHours(), m = d.getMinutes();
    return `${pad(day)}/${pad(month+1)} ${pad(h)}:${pad(m)}`;
  },
  valueFormat  : v => v.valueOf().toFixed(0),
  valueToColor(v) {
    const r = this.data.norm(v.valueOf());
    return d3.rgb(255*r, 255*(1-r),0);
  },
  createSVG(target, size) {
    const middle = this.size/2, radius = this.clockRadius, lineHeight = radius/5;
    return d3.select(target).html(`
      <svg width="${size}" height="${size}">
        <style>
          #cursor{
            stroke : #999;
          }
          #legend > text {
            text-anchor: middle;
            font-size: 20;
            font-family: mono;
          }
          #dateLegend {
            fill: #999;
          }
          .valueBar {
            stroke-dasharray: 5,1;
            stroke-width: 2;
          }
          .circ {
            fill: none;
          }
        </style>
        <line id="cursor"
              x1="${size/2}" y1="${size/2 - this.clockRadius + 10}"
              x2="${size/2}" y2="0"></line>
        <g id="legend">
          <text id="dateLegend"
                x="${size/2}" y="${middle - radius/2 + lineHeight}"></text>
          <text id="valueLegend"
                x="${size/2}" y="${middle + radius/2 - lineHeight}"></text>
        </g>
      </svg>
    `).select("svg");
  },
  paintValueBars() {
    const last = this.data.last();
    const paintingData = this.data.raw.filter(
        d => last.date-d.date < this.timeInClock
    );
    const valueBars = this.svg.selectAll("line.valueBar").data(paintingData);
    const s = this.size, m=s/2, r = this.clockRadius;
    valueBars.enter().append("line")
      .attr("class", "valueBar")
      .attr("id", d => "datum-"+d.date)
      .attr("x1", m).attr("y1", m-r).attr("x2", m);
    valueBars.attr("transform", d => {
        const alpha = this.dateToAngle(d.date);
        return `rotate(${alpha}, ${m}, ${m})`
    });
    valueBars
      .transition()
      .attr("y2", d => m - this.scale(d.value))
      .attr("stroke", d => this.valueToColor(d.value));
    valueBars.exit().remove();
  },
  paintCircs() {
    const m = this.size/2,
          min = this.clockRadius, max = this.size/2;
    const circs = this.svg.selectAll("circle.circ")
      .data([min, (min+max)/2, max]);
    circs.enter()
      .append("circle").attr("class", "circ");
    circs.attr("cx", m).attr("cy", m).attr("r", d=>d)
         .attr("stroke", d=>d3.rgb((d-min)/(max-min)*255, 80, 80))
  },
  paint() {
    this.paintValueBars();
    this.paintCircs();
  },
  moveCursor(datum) {
    const angle = this.dateToAngle(datum.date) * Math.PI/180  - Math.PI/2;
    const r = this.clockRadius, m = this.size/2;
    this.svg.select("#cursor")
       .attr("x1", m + Math.cos(angle)*(r-10))
       .attr("y1", m + Math.sin(angle)*(r-10))
       .attr("x2", m + Math.cos(angle)*m)
       .attr("y2", m + Math.sin(angle)*m);
    this.svg.select("#dateLegend").text(this.dateFormat(datum.date));
    this.svg.select("#valueLegend")
              .text(this.valueFormat(datum.value))
              .transition()
              .attr("fill", this.valueToColor(datum.value));
  },
  addHandlers() {
    this.svg.on("mousemove", () => {
      const [x,y] = d3.mouse(this.svg.node());
      const m = this.size/2;
      const angle = Math.atan2(x-m, m-y) * 180 / Math.PI;
      const dist = d => (Math.abs(this.dateToAngle(d.date)-angle) + 360 ) % 360;
      var datum = this.data.raw.reduce((p,c) => dist(p) < dist(c) ? p : c);
      this.moveCursor(datum);
    });
    this.svg.on("click", () => d3.event.preventDefault() && false);
  }
};

RoundPlot.Data = function Data(raw=[]) {
  if (raw.length !== 0) { 
    this.raw = raw;
    [this.min, this.max] = this.raw.reduce(
        (prev, cur) => {
          if (cur.value<prev[0]) prev[0] = cur.value;
          if (cur.value>prev[1]) prev[1] = cur.value;
          return prev;
        },
        [Infinity, -Infinity]);
  } else {
    this.raw = raw, this.min=this.max=0;
  }
}
RoundPlot.Data.prototype = {
  norm(x) {return (x-this.min) / (this.max - this.min)},
  first() {return this.raw[0]},
  last()  {return this.raw[this.raw.length-1]}
}
