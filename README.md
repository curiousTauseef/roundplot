# RoundPlot
Roundplot is a javascript library, based on [D3](http://d3js.org/) to create circular time plots.

### Screenshot
![RoundPlot screenshot](http://pix.toile-libre.org/upload/original/1433946517.png)
### Examples
See the [simple demo](http://lovasoa.github.io/roundplot/dist/simple-demo.html),
the [customization demo](http://lovasoa.github.io/roundplot/dist/demo.html),
or the [jsfiddle](http://jsfiddle.net/xozbrv73/).


## How to use
### Inclusion
Include  d3 and roundplot in your page.
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js" charset="utf-8"></script>
<script src="http://lovasoa.github.io/roundplot/dist/roundplot.js" charset="utf-8"></script>
```
Or use [bower](http://bower.io/) : `bower install roundplot`.

### API
### Available options
```javascript
var plot = new RoundPlot({
    data: data,
    target: "#graph",
    size: 550, // size of the generated svg, in px
    clockRadius: 150, // Radius of the inner circle
    timeInClock: 1*60*60*1000, // How much time (in ms) a full circle represents
    valueToColor: function (v){return v>3?"red":"green";}, // Color of the bars
    dateFormat: function(d){return d.toLocaleString();},
    valueFormat: function(v){return v.toFixed(2)},
});
```
### Available methods
#### RoundPlot.prototype.setData(data)
Updates the data of the plot.
