'use strict';

var version = "1.0.0";


var ChartsAPI = new ChartRequests();

function dict_length(d) { let c = 0; for (let p in d) { c++; }; return c; }

function main() {
    let chartContainers = get_chart_containers();
    for (let chartContainer of chartContainers) {
        fetch_chart(chartContainer);
    }
};

function get_chart_containers() {
    return document.querySelectorAll('.async-chart');
}

function fetch_chart(chartContainer) {
    let chartType   = chartContainer.getAttribute('data-chart-type');
    let start       = chartContainer.getAttribute('data-chart-start');
    let end         = chartContainer.getAttribute('data-chart-end');
    let sources     = chartContainer.getAttribute('data-chart-sources');
    if (!sources) sources = '';

console.log('fetch', chartType, start, end, sources);

    ChartsAPI.requestChart(start, end, sources, draw_chart.bind(null, chartContainer, chartType));

}

var draw_chart = function(chartContainer, chartType, data) {
    console.log('draw', chartContainer, chartType, data);
    
    var seriesCardinality = dict_length(data.seriesLegend), // dict representing series Legend (The number of series).
        xCardinality = data.xLegend.length;                 // array with X Labels - The number of values per series.

    return;

    // The xz array has m elements, representing the x-values shared by all series.
    // The yz array has n elements, representing the y-values of each of the n series.
    // Each yz[i] is an array of m non-negative numbers representing a y-value for xz[i].
    // The y01z array has the same structure as yz, but with stacked [y₀, y₁] instead of y.
    var xz = d3.range(xCardinality),
        yz = d3.range(seriesCardinality).map(function() { return bumps(xCardinality); }),
        y01z = d3.stack().keys(d3.range(seriesCardinality))(d3.transpose(yz)),
        yMax = d3.max(yz, function(y) { return d3.max(y); }),
        y1Max = d3.max(y01z, function(y) { return d3.max(y, function(d) { return d[1]; }); });

    var margin = {top: 40, right: 10, bottom: 20, left: 10},
        width = +chartContainer.attr("width") - margin.left - margin.right,
        height = +chartContainer.attr("height") - margin.top - margin.bottom,
        g = chartContainer.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleBand()
        .domain(xz)
        .rangeRound([0, width])
        .padding(0.08);

    var y = d3.scaleLinear()
        .domain([0, y1Max])
        .range([height, 0]);

    // set color scheme
    var color = d3.scaleOrdinal()
        .domain(d3.range(seriesCardinality))
        .range(d3.schemeCategory20c);

    var series = g.selectAll(".series")
      .data(y01z)
      .enter().append("g")
        .attr("fill", function(d, i) { return color(i); });

    var rect = series.selectAll("rect")
      .data(function(d) { return d; })
      .enter().append("rect")
        .attr("x", function(d, i) { return x(i); })
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("height", 0);

    rect.transition()
        .delay(function(d, i) { return i * 10; })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); });

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
            .tickSize(0)
            .tickPadding(6));

    d3.selectAll("input")
        .on("change", changed);

}

function changed() {
  timeout.stop();
  if (this.value === "grouped") transitionGrouped();
  else transitionStacked();
}

function transitionGrouped() {
  y.domain([0, yMax]);

  rect.transition()
      .duration(500)
      .delay(function(d, i) { return i * 10; })
      .attr("x", function(d, i) { return x(i) + x.bandwidth() / n * this.parentNode.__data__.key; })
      .attr("width", x.bandwidth() / n)
    .transition()
      .attr("y", function(d) { return y(d[1] - d[0]); })
      .attr("height", function(d) { return y(0) - y(d[1] - d[0]); });
}

function transitionStacked() {
  y.domain([0, y1Max]);

  rect.transition()
      .duration(500)
      .delay(function(d, i) { return i * 10; })
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d) { return y(d[0]) - y(d[1]); })
    .transition()
      .attr("x", function(d, i) { return x(i); })
      .attr("width", x.bandwidth());
}

// Returns an array of m psuedorandom, smoothly-varying non-negative numbers.
// Inspired by Lee Byron’s test data generator.
// http://leebyron.com/streamgraph/
function bumps(m) {
  var values = [], i, j, w, x, y, z;

  // Initialize with uniform random values in [0.1, 0.2).
  for (i = 0; i < m; ++i) {
    values[i] = 0.1 + 0.1 * Math.random();
  }

  // Add five random bumps.
  for (j = 0; j < 5; ++j) {
    x = 1 / (0.1 + Math.random());
    y = 2 * Math.random() - 0.5;
    z = 10 / (0.1 + Math.random());
    for (i = 0; i < m; i++) {
      w = (i / m - y) * z;
      values[i] += x * Math.exp(-w * w);
    }
  }

  // Ensure all values are positive.
  for (i = 0; i < m; ++i) {
    values[i] = Math.max(0, values[i]);
  }

  return values;
}


setTimeout(main, 0); // schedule function to be run as soon as possible
