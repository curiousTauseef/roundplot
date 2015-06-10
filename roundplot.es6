function RoundPlot(params={}) {
  this.data = new RoundPlot.Data(params.data);
  this.clockRadius = params.clockRadius || 100;
  this.size = params.size || 500;
  this.svg = d3.select(params.target+" svg");
  if (this.svg.node() === null) this.svg = this.createSVG(params.target, this.size); 
  this.addHandlers();
  this.t0  = params.t0 ||  this.data.first().date;
  this.timeInClock = params.timeInClock || 12 * 60 * 60 * 1000; // Default to 12 hours in the clock
  if (params.dateFormat) this.dateFormat = params.dateFormat;
  if (params.valueToColor) this.valueToColor = params.valueToColor;
  this.paint();
  this.moveCursor(this.data.last());
}

RoundPlot.prototype = {
  scale(x) {
    return this.clockRadius + this.data.norm(x) * (this.size/2 - this.clockRadius);
  },
  setData(rawData, moveCursor=true) {
    this.data = new RoundPlot.Data(rawData);
    if (moveCursor) this.moveCursor(this.data.last());
    this.paint();
  },
  dateToAngle(d) { //Returns an angle in degrees
    return (d - this.t0) * 360 / this.timeInClock;
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
            stroke-dasharray: 5,5;
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
    const valueBars = this.svg.selectAll("line.valueBar").data(this.data.raw);
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
    const m = this.size/2;
    const circs = this.svg.selectAll("circle.circ")
      .data([this.data.min, (this.data.max+this.data.min)/2, this.data.max]);
    circs.enter()
      .append("circle").attr("class", "circ");
    circs.attr("cx", m).attr("cy", m).attr("r", d=>this.scale(d))
         .attr("stroke", d=>d3.rgb(10+100*this.data.norm(d), 20, 20))
  },
  paint() {
    this.paintValueBars();
    this.paintCircs();
  },
  moveCursor(datum) {
    const angle = this.dateToAngle(datum.date) * Math.PI/180  - Math.PI/2;
    const max = this.data.max;
    this.svg.select("#cursor")
       .attr("x1", this.size/2 + Math.cos(angle)*(this.clockRadius-10))
       .attr("y1", this.size/2 + Math.sin(angle)*(this.clockRadius-10))
       .attr("x2", this.size/2 + Math.cos(angle)*this.scale(max))
       .attr("y2", this.size/2 + Math.sin(angle)*this.scale(max));
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

RoundPlot.Data = function Data(raw) {
  this.raw = raw;
  var values = raw.map(d=>d.value.valueOf());
  this.min = values.reduce((a,b)=>a<b?a:b);
  this.max = values.reduce((a,b)=>a>b?a:b);
}
RoundPlot.Data.prototype = {
  norm(x) {return (x-this.min) / (this.max - this.min)},
  first() {return this.raw[0]},
  last()  {return this.raw[this.raw.length-1]}
}

