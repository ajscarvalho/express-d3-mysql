'use strict';

var version = "1.0.0";


var ChartsAPI = new ChartRequests();
var inputHandler = new HomeInputHandler();
var tabHandler = new TabHandler();

var mapaAPI = new mapaRequests();


function dict_length(d) { let c = 0; for (let p in d) { c++; }; return c; }


var mapColourData = {};

var incomingMapData = function(data) {
	mapColourData = {};
	for (let row of data.colour) {
		mapColourData[row.concelho] = row;
	}
	change_colours();
}


var change_colours = function(data)
{
	var mapAggLvl = document.getElementById('mapAggregationLevel');
	console.log("mapAggLvl", mapAggLvl.value)
   //console.log("change_colours",data.colour);
	//let concelhos = document.getElementsByClassName("async-concelho"); 
	console.log(mapColourData)
	for (let municipalityName in mapColourData) {
		let municipality = document.getElementById(municipalityName);
		if (!municipality) { console.log(municipalityName, 'Not Found'); continue; }

		let record = mapColourData[municipalityName];
		let property = 'colour';
		if (mapAggLvl.value == 'ao') property = 'colour_ao';
		if (mapAggLvl.value == 'drc') property = 'colour_drc';

		municipality.style.fill = record[property];
	} 
	
}

/*
function box(x)
{
	let nome = x.getAttribute("name");
//	let p = document.getElementById('popup');
	console.log("box",nome )
//	p.style.display = 'block';
	return;
}

function box_out(x)
{
//	let p = document.getElementById('popup');
//	console.log("box_out")
//	p.style.display = 'none';
	return;
}
*/

function main() {
    tabHandler.tab_click(document.getElementById('chart_tab'));//chart_tab, map_tab

	var mapAggLvl = document.getElementById('mapAggregationLevel');
	mapAggLvl.addEventListener('change', change_colours, false)

	ChartsAPI.get_drc_list(inputHandler.fillDRCs.bind(inputHandler));
	inputHandler.defineCallBack(fetch_charts_on_change);
	inputHandler.apply() // fetch
	mapaAPI.requestmapa(null, incomingMapData.bind(null));
//    fetch_municipalities();
};


function get_chart_containers() {
	return document.querySelectorAll('.async-chart');
}

function fetch_charts_on_change(data) 
{
	let chartContainers = get_chart_containers();
	let drc 	  = data.drc
	let start     = data.start; 
	let end       = data.end;
	let chartType;
	let endpoint;

	for (let chartContainer of chartContainers) {
		chartType = chartContainer.getAttribute('data-chart-type');
		endpoint  = chartContainer.getAttribute('data-endpoint');
		d3.select(chartContainer).select('svg').remove();
		ChartsAPI.requestChart(endpoint, drc, start, end, draw_chart.bind(null, chartContainer, chartType));
	}

}




var get_series_list = function(seriesLegend) {
	let seriesData = {l: [], d: {} };
	let i = 0; 
	for (let s in seriesLegend) {
		seriesData.l[i] = {id:  s, legend: seriesLegend[s] };
		seriesData.d[s] = {pos: i, legend: seriesLegend[s] };
		i+= 1;
	}
	return seriesData;
}

var draw_chart = function(chartContainer, chartType, data) {
	if (chartType == 'stacked')
		draw_stacked_chart(chartContainer, data)
	else console.error('unknown chartType', chartType, 'for', chartContainer);
}

var draw_stacked_chart = function(chartContainer, data) {

	// config
	let margin = {top: 10, right: 10, bottom: 60, left: 40};
	let barSpacing = 5;
	// calculated in terms of existing container
//	let svgWidth  = parseInt(chartContainer.style.width); //chartContainer.width.baseVal.value;
//	let svgHeight = parseInt(chartContainer.style.height);

	let svgWidth  = chartContainer.offsetWidth;
	let svgHeight = chartContainer.offsetHeight;
	
	let graphWidth  = svgWidth  - margin.left - margin.right;
	let graphHeight = svgHeight - margin.top  - margin.bottom;

	let seriesCardinality = dict_length(data.seriesLegend); // dict representing series Legend (The number of series).
	let xCardinality      = data.xLegend.length;            // array with X Labels - The number of values per series.
	
	let barWidth = Math.floor(graphWidth / xCardinality) - barSpacing;

//    console.log('draw', chartContainer, chartType, data, svgWidth);
//    console.log('bar width', barWidth);

	let seriesList = get_series_list(data.seriesLegend);
	//console.log("seriesList", seriesList);
//    var xLegend = get_horizontal_legend(data.xLegend);
//    console.log('xLegend', xLegend);

	let xz = d3.range(xCardinality),
		yz = d3.range(seriesCardinality).map(function() { return d3.range(xCardinality) });
	
	for (let pt of data.points) {
		let s = seriesList.d[pt.data_series_id];
		yz[s.pos][pt.x] = pt.value;
	}
	//console.log("data", data);
	//console.log("yz", yz);
	// TODO fill yz

	let yMax = d3.max(yz, function(y) { return d3.sum(y); });

//    let svg = d3.select(chartContainer);
	let svg = d3.select(chartContainer).append("svg")
		.attr("width", svgWidth).attr("height", svgHeight);

	let g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// The y01z array has the same structure as yz, but with stacked [y₀, y₁] instead of y.
	let y01z = d3.stack().keys(d3.range(seriesCardinality))(d3.transpose(yz));
	let y1Max = d3.max(y01z, function(yy) { return d3.max(yy, function(dd) { return dd[1]; } ); }); // ???


	// axis
	let xScale = d3.scaleLinear()
		.domain( [0, xCardinality] ) // -1
		.range( [0, graphWidth] );

	let yScale = d3.scaleLinear()
		.domain([0, y1Max])
		.range([graphHeight, 0]);

	// set color scheme
	var colorScheme = d3.scaleOrdinal()
		.domain(d3.range(seriesCardinality))
		.range(d3.schemeCategory20c);

	console.log("colorScheme", colorScheme(0), colorScheme(1));

	var yAxis = d3.axisLeft()
		.scale(yScale)
		.tickSize(1)
		.tickFormat(function(d) { return d + "M"}); // Math.round(d / 1e6) + "M"; });


	var series = g.selectAll(".series")
		.data(y01z)
		.enter().append("g")
		.attr("fill", function(d, i) { console.log('fill', d, i); return colorScheme(i); });

	var rect = series.selectAll("rect")
	  .data(function(d) { return d; })
	  .enter().append("rect")
		.attr("x", function(d, i) { return xScale(i); })
		.attr("y", graphHeight)
		.attr("width", barWidth)//xScale.bandwidth())
		.attr("height", 0);

	rect.transition()
		.delay(function(d, i) { return i * 10; })
		.attr("y", function(d) { console.log('y', d[1], yScale(d[1])); return yScale(d[1]); })
		.attr("height", function(d) { console.log('height', d[0], d[1], yScale(d[0]) - yScale(d[1])); return yScale(d[0]) - yScale(d[1]); });

	// add x-axis.
//*    
	g.append("g")
//        .attr("class", "axis axis--x")
		.attr("transform", "translate(0," + graphHeight + ")")
		.call(d3.axisBottom(xScale)
			.tickSize(1)
			.tickPadding(6)
			.tickFormat(function(d) { return data.xLegend[d]; })
		)
		.selectAll("text")
		.attr("transform", "rotate(-90)")
		.attr("x", 9)
		
//        .attr("transform", "translate(" + barWidth/2 + ", 100); rotate(-90)");
//*/
	// Add y-axis.
	g.append("g")
		.attr("class", "axis axis--y")
	  //  .attr("transform", "translate(10, 0)")
		.call(yAxis)
	.selectAll("g")
	.filter(function(value) { return value != '0M'; })
		.classed("zero", true);
	
	return;


}






/*
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

*/
setTimeout(main, 0); // schedule function to be run as soon as possible
