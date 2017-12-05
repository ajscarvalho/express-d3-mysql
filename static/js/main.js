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
	switch (chartType){
		case 'stacked':	return draw_stacked_chart(chartContainer, data);
		case 'line':	return draw_line_chart   (chartContainer, data);

		default: console.error('unknown chartType', chartType, 'for', chartContainer);
	}
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



var draw_line_chart = function(chartContainer, data) {

	// config
	let margin = {top: 10, right: 10, bottom: 60, left: 40};

	let svgWidth  = chartContainer.offsetWidth;
	let svgHeight = chartContainer.offsetHeight;
	
	let graphWidth  = svgWidth  - margin.left - margin.right;
	let graphHeight = svgHeight - margin.top  - margin.bottom;

	let seriesCardinality = dict_length(data.seriesLegend); // dict representing series Legend (The number of series).
	let xCardinality      = data.xLegend.length;            // array with X Labels - The number of values per series.
	
	let xSpacing = Math.floor(graphWidth / xCardinality);

	let seriesList = get_series_list(data.seriesLegend);
	console.log("seriesList", seriesList);

	let xz = d3.range(xCardinality),
		yz = d3.range(seriesCardinality).map(function() { return d3.range(xCardinality) });
	
	for (let pt of data.points) {
		let s = seriesList.d[pt.data_series_id];
		yz[s.pos][pt.x] = pt.value;
	}

	let svg = d3.select(chartContainer).append("svg")
		.attr("width", svgWidth).attr("height", svgHeight);

	let g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// [series => [y0, y1, ... yn]]
	let y01z = []
	for (let d of data.points) {
		if (!y01z[d.data_series_id]) y01z[d.data_series_id] = []
		y01z[d.data_series_id][d.x] = [d.x , d.value]; // * xSpacing
	}

	let y1Max = d3.max(data.points, function(d) { return d.value; }) * 1.05; // 5% margin

	// axis
	let xScale = d3.scaleLinear()
		.domain( [-1, xCardinality] ) // -1
		.range( [0, graphWidth] );

	let yScale = d3.scaleLinear()
		.domain([0, y1Max])
		.range([graphHeight, 0]);

	// set color scheme
	let colorScheme = function(s) { return s ? '#ff0000' : '#0000ff'; };

	//console.log("colorScheme", colorScheme(0), colorScheme(1));

	var yAxis = make_y_axis(yScale, 10); // add tickFunction?
	var xAxis = make_x_axis(xScale, data.xLegend); // add tickFunction?

	draw_axis(g, xAxis, yAxis, graphHeight);


//	var series = g.append('g').attr('class', 'series');

//*
	var series = g.selectAll(".series")
		.data(y01z)
		.enter().append("g").attr('fill', 'none')
//*/

	var curve = d3.line()
   		.curve(d3.curveCardinal)
   		.x(function(p) { return xScale(p[0]); } )
   		.y(function(p) { return yScale(p[1]); } )


	var path = series.selectAll("path")
	  	.data(function(x,y) { return [{points: x, seriesId: y}]; })
	  	.enter()
	  	.append("path")
			.style("stroke", function(data) {
				return colorScheme(data.seriesId);
			}).datum( function(x,y) { return x.points; })
			.attr("d", curve)
			.enter();

	addPoints(data.points, g, xScale, yScale, colorScheme, data.xLegend)

	return;
}


function addPoints(data, g, xScale, yScale, color, xLegend) {

	g.selectAll("data-point")
		.data(data)
		.enter()
		.append("svg:circle")
			.attr("class", "data-point")
			.style("opacity", 1)
			.style("stroke", function(d) { return color(d.data_series_id); })
			.style("fill", function(d) { return '#eeeeee'; }) // color(d.data_series_id);  })
			.attr("cx", function(d) { return xScale(d.x); })
			.attr("cy", function(d) { return yScale(d.value); })
			.attr("data-value",  function(d) { return d.value; })
			.attr("data-legend", function(d) { return xLegend[d.x]; })
			.attr("data-series", function(d) { return d.data_series_id; })
			.attr("r", 2)
			.on("mouseover", mouse_over)
        	.on("mouseout",  mouse_out)
}



var legendTimer = null;
var legend = document.getElementById('chartLegend')
var legendDirection = 'in'
var fadeConfig = {in: {speed: 0.2, timeout: 0} , out: {speed: -0.05, timeout: 1000}, min: 0, max: 0.95 };
legend.style.opacity = 0;



function mouse_over() {
	let elem = d3.select(this);
	elem.style('fill', elem.style('stroke'));

	let ev = window.event;
	let offset = getOffsetTop(this);
	let chartWidth = getOffsetWidth(this);

console.log('screenY', ev.screenY, 'clientY', ev.clientY, 'offset', offset, chartWidth);

	legend.style.display = 'block';
	legend.style.top  = (ev.clientY + window.scrollY - offset + 10) + "px";
	
	if (ev.clientX < chartWidth/2)
		legend.style.left = (ev.clientX ) + "px";
	else
		legend.style.left = (ev.clientX - 20 - legend.offsetWidth) + "px"; // 10 padding + 10 margin

	legend.innerHTML = 
		'<div class="label">Valor</div>' +
		'<div class="value">' + elem.attr("data-value") + ' ' + get_unit(elem.attr('data-series')) + '</div>' + 
		'<div class="label">Data</div>' + 
		'<div class="value">' + elem.attr("data-legend") + '</div>';

	legendDirection = 'in'
	legendTimer = setTimeout(legend_fader, fadeConfig[legendDirection].timeout);
}

function get_unit(seriesId) {
	switch(seriesId) {
		case '0': return 'MW';
		case '1': return 'MVAr';
	}
	return '';
}

function mouse_out(){
	let elem = d3.select(this);
	elem.style('fill', '#eeeeee');
	legendDirection = 'out'
	legendTimer = setTimeout(legend_fader, fadeConfig[legendDirection].timeout);
}



function legend_fader(){
	let cfg = fadeConfig[legendDirection]
	let nextVal = parseFloat(legend.style.opacity) + cfg.speed;

	if (nextVal > fadeConfig.max) { 
		legend.style.opacity = fadeConfig.max;
		return;
	}

	if (nextVal < fadeConfig.min) {
		legend.style.opacity = fadeConfig.min;
		legend.style.display = 'none';
		return;
	}

	legend.style.opacity = nextVal;

	requestAnimationFrame(legend_fader);
}


function make_curve(data, pos) {
	var curve = d3.line()
   		.curve(d3.curveCardinalOpen)
   		.x(function(p) { return p[0]; } )
   		.y(function(p) { return p[1] } )
   	return curve;
}

function getOffsetTop(node) {
	let acc = 0;
	while (node.parentNode) {
		if (node.offsetTop)	return node.offsetTop; 
		node = node.parentNode;
	}
	return 0;
}

function getOffsetWidth(node) {
	let acc = 0;
	while (node.parentNode) {
		if (node.offsetWidth) return node.offsetWidth; 
		node = node.parentNode;
	}
	return 0;
}


function draw_axis(g, x, y, graphHeight)
{
	// add x-axis.
    
	g.append("g")
        .attr("class", "axis axis--x")
		.attr("transform", "translate(0," + graphHeight + ")")
		.call(x)
		.selectAll("text")
      		.call(date_legend_break)
			.attr("transform", "rotate(-90)")
			.attr("x", 9)
			
//        .attr("transform", "translate(" + barWidth/2 + ", 100); rotate(-90)");

	// Add y-axis.
	g.append("g")
		.attr("class", "axis axis--y")
		.call(y)
	.selectAll("g")
		.filter(function(value) { return value != '0M'; } )
		.classed("zero", true);
}

function date_legend_break(text)
{
	text.each(function() {
		let lineHeight = 1.1; // ems
		let xOffset = -30;
		let text = d3.select(this);
        let words = text.text().split(' ');
        console.log("break", words);
		let y = -10;
        let dy = parseFloat(text.attr("dy"));
		let tspan = text.text(null).append("tspan").attr("x", xOffset).attr("y", y).attr("dy", dy + "em");
		tspan.text(words[0]); // add date
		tspan = text.append("tspan").attr("x", xOffset).attr("y", y).attr("dy", lineHeight + dy + "em").text(words[1]);
	})
}


function make_x_axis(scale, legend) {
	return d3.axisBottom().scale(scale)
		.tickSize(1)
		.tickFormat(function(d) { if (legend[d]) return legend[d]; })
}

function make_y_axis(scale, ticks, tickFormat) {
    return d3.axisLeft()
		.scale(scale)
		.tickSize(1)
		.ticks(ticks)
		.tickFormat(tickFormat);
}

setTimeout(main, 0); // schedule function to be run as soon as possible
