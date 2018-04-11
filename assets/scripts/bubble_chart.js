// Tooltip

// We declare it outside of the function draw_bubble, which is the same as declaring it on the "main",
// which is nothing more than the general scope. All variables declared outside a function can be called
// from all the files as if they were on the same file.

var tip_bubble = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .direction('e')

tip_bubble.html(function (d) {
  return [
    "<center><strong>" + d.Name + "</center></strong><br>" +   // <font size=4>  </font>
    "Universities: <strong>" + d.Universities + "</strong><br>" +
    "Total number of students in country:<strong>" + d.NStudents + "</strong><br>" +
    "Students sent: <strong>" + d.Sending + "</strong><br>" +
    "Ratio of students sent: <strong>" + d.Sending_ratio + "</strong><br>" +
    "Students received: <strong>" + d.Receiving + "</strong><br>" +
    "Ratio of students received: <strong>" + d.Receiving_ratio + "</strong><br>"
  ]
})



function draw_bubble_chart(canvas) {


  canvas.select(".chart")
    .remove()

  var chart = canvas.append("g")
    .attr("class", "chart")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")") // Center the graph in the SVG

  // Horizontal axis
  chart.append("g")
    .attr("class", "Xaxis")
    .attr("transform", "translate(0," + height + ")")

  var xtext = chart.append("text")
    .attr("class", "xtext")
    .attr("transform", "translate(" + (width / 2) + ", " + (height + margin.top / 1.4) + ")")
    .style("font-weight", "bold")
    .style("text-anchor", "middle")
    .text("Students received");
  // .html("Ratio of sent students ・e"+ width/2) 

  // Vertical axis
  chart.append("g")
    .attr("class", "Yaxis")

  var ytext = chart.append("text")
    .attr("class", "ytext")
    .attr("transform", "translate(" + (-margin.left / 1.6) + ", " + (height / 2) + ") rotate(-90)")
    .style("font-weight", "bold")
    .style("text-anchor", "middle")
    .text("Students sent");

  chart.append("g")
    .attr("class", "bubble_chart")

  var legendata = [40, 20, 10]

  var legend = chart.append("g")
    .attr("class", "legend")

  legend.selectAll("circle")
    .data(legendata)
    .enter()
    .append("circle")
    .attr("cx", width + margin.right / 3)
    .attr("cy", function (d) { return height * 6.8 / 8 - d / 2 })
    .attr("r", function (d) { return d / 2 })
    .attr("stroke", "grey")
    .attr("opacity", function (d, i) { return 0.2 + i * 0.02 })
    .attr("fill", "grey")
    .attr("stroke-opacity", 0.6)


  legend.append("text")
    .text("University")
    .attr("transform", "translate(" + (width + margin.right / 3) + ", " + height * 7 / 8 + ")")
    .style("font-size", "10px")
    .attr("text-anchor", "middle")
    .attr("fill", "grey")


  legend.append("text")
    .text("Students in the")
    .attr("transform", "translate(" + (width + margin.right / 3) + ", " + height * 7.2 / 8 + ")")
    .style("font-size", "10px")
    .attr("text-anchor", "middle")
    .attr("fill", "grey")

  legend.append("text")
    .text("Country")
    .attr("transform", "translate(" + (width + margin.right / 3) + ", " + height * 7.4 / 8 + ")")
    .style("font-size", "10px")
    .attr("text-anchor", "middle")
    .attr("fill", "grey")

  return [chart, xtext, ytext];

}



// Transition function
function draw_bubble(chart, data, xtext, ytext) {

  var t = d3.transition()
    .ease(d3.easeCubic)
    .duration(1600)

  chart.call(tip_bubble)

  reset_bubble(chart, tip_bubble)
  //tip_bubble.hide() // Hide at the beginning of the transition

  // Calculate bubbles scale
  rmax = d3.max(data, function (d) { return d.NStudents })
  if (width < 500) { rscale = d3.scaleSqrt().domain([0, rmax]).range([3.5, 20]); }
  else { rscale = d3.scaleSqrt().domain([0, rmax]).range([5, 30]) }


  if (currentbutton == "normalized") {

    // Axis

    // we get the position of the first decimal value != 0 to resize the axis without 0.0000...
    function getDecimals(value) {
      var decimals = value.toString().split(".")[1]
      var ln = decimals.length
      var i = 0

      while ((i + 1) < ln && decimals.substring(i, i + 1) == 0) {
        i++
      }

      var expo = i + 1
      return expo
    }

    xmax = d3.max(data, function (d) { return d.Receiving / d.NStudents })
    ymax = d3.max(data, function (d) { return d.Sending / d.NStudents })

    var expox = getDecimals(xmax)
    var expoy = getDecimals(ymax)

    // We change xmax and ymax to resize axis

    xmax = xmax * Math.pow(10, expox)
    ymax = ymax * Math.pow(10, expoy)


    var xscale = d3.scaleLinear().domain([0, xmax]).range([0, width]);
    var yscale = d3.scaleLinear().domain([0, ymax]).range([height, 0]);

    var xAxis = d3.axisBottom(xscale)
    var yAxis = d3.axisLeft(yscale)


    chart.select(".Xaxis")
      .transition(t)
      .call(xAxis)

    chart.select(".Yaxis")
      .transition(t)
      .call(yAxis)


    xtext.text("Ratio of students sent (e-" + expox + ")")

    ytext.text("Ratio of students received (e-" + expoy + ")")


    // Create the bubbles //
    var bubble_chart = chart.select(".bubble_chart")
      .selectAll(".bubble-element")
      .data(data)

    // Remove old bubbles
    bubble_chart.exit().remove()

    // Add/Update the bubbles
    var newbubble = bubble_chart.enter()
      .append("g")
      .attr("class", "bubble-element")
      .style("fill-opacity", 0.7)
      .on("click", function () {
        if (d3.select(this.firstChild).classed("bubble_selected")) { reset_bubble(chart, tip_bubble) }
        else { fade_bubble(this.__data__.Name, newbubble, tip_bubble) }
      })
      .on("mouseover", function () {
        if ($('.bubble_selected').length == 0)  // Check if any bubble has been selected and deactivate the mouseover if so
        {
          d3.select(this).style("fill-opacity", 0.9);
          tip_bubble.show(this.__data__, this)
        }
      })
      .on("mouseout", function () {
        if ($('.bubble_selected').length == 0) {
          d3.select(this).style("fill-opacity", 0.7);
          tip_bubble.hide(this.__data__, this)
        }
      })

    newbubble.append("circle")
    newbubble.append("text")

    bubble_chart.merge(newbubble)
      .select("circle")
      .transition(t)
      .attr("cx", function (d) {
        return xscale((d.Receiving / d.NStudents) * Math.pow(10, expox))
      })
      .attr("cy", function (d) {
        return yscale((d.Sending / d.NStudents) * Math.pow(10, expoy))
      })
      .attr("r", function (d) {
        return rscale(d.NStudents);
      })
      .style("fill", "#ff8808") //Easter egg ;)
    // .on("end", function () { if ($('.bubble_selected').length != 0) { tip_bubble.show($('.bubble_selected')[0].__data__) } })

    bubble_chart.merge(newbubble)
      .select("text")
      .transition(t)
      .attr("pointer-events", "none")
      .attr("x", function (d) { return xscale((d.Receiving / d.NStudents) * Math.pow(10, expox)) })
      .attr("y", function (d) { return yscale((d.Sending / d.NStudents) * Math.pow(10, expoy)) + (rscale(d.NStudents) / 4) })
      .attr("font-size", function (d) { return rscale(d.NStudents / 2) })
      .attr("text-anchor", "middle")
      .text(function (d) { return d.id })

    return chart
  }


  else if (currentbutton == "absolute") {

    var text_rec = "Students Received"
    var text_send = "Students Sent"

    var xmax = 1.1 * (d3.max(data, function (d) { return d.Receiving }))
    var ymax = 1.1 * (d3.max(data, function (d) { return d.Sending }))

    var xscale = d3.scaleLinear().domain([0, xmax]).range([0, width]);
    var yscale = d3.scaleLinear().domain([0, ymax]).range([height, 0]);

    var xAxis = d3.axisBottom(xscale)
    var yAxis = d3.axisLeft(yscale)

    chart.select(".Xaxis")
      .transition(t)
      .call(xAxis)

    chart.select(".Yaxis")
      .transition(t)
      .call(yAxis)


    xtext.text(text_rec)

    ytext.text(text_send)


    // Create the bubbles
    var bubble_chart = chart.select(".bubble_chart")
      .selectAll(".bubble-element")
      .data(data)

    // Remove old bubbles
    bubble_chart.exit().remove()

    // Add/Update the bubbles
    var newbubble = bubble_chart.enter()
      .append("g")
      .attr("class", "bubble-element")
      .style("fill-opacity", 0.7)
      .on("click", function () {
        if (d3.select(this.firstChild).classed("bubble_selected")) { reset_bubble(chart, tip_bubble) }
        else { fade_bubble(this.__data__.Name, newbubble, tip_bubble) }
      })
      .on("mouseover", function () {
        if ($('.bubble_selected').length == 0)  // Check if any bubble has been selected and deactivate the mouseover if so
        {
          d3.select(this).style("fill-opacity", 0.9);
          tip_bubble.show(this.__data__, this)
        }
      })
      .on("mouseout", function () {
        if ($('.bubble_selected').length == 0) {
          d3.select(this).style("fill-opacity", 0.7);
          tip_bubble.hide(this.__data__, this)
        }
      })

    newbubble.append("circle")
    newbubble.append("text")

    bubble_chart.merge(newbubble)
      .select("circle")
      .transition(t)
      .attr("cx", function (d) {
        return xscale(d.Receiving);
      })
      .attr("cy", function (d) {
        return yscale(d.Sending);
      })
      .attr("r", function (d) {
        return rscale(d.NStudents);
      })
      .style("fill", "#ff8808") //Easter egg ;)
    // .on("end", function () { if ($('.bubble_selected').length != 0) { tip_bubble.show($('.bubble_selected')[0].__data__) } })

    bubble_chart.merge(newbubble)
      .select("text")
      .transition(t)
      .attr("pointer-events", "none")
      .attr("x", function (d) { return xscale(d.Receiving) })
      .attr("y", function (d) { return yscale(d.Sending) + (rscale(d.NStudents) / 4) })
      .attr("font-size", function (d) { return rscale(d.NStudents / 2) })
      .attr("text-anchor", "middle")
      .text(function (d) { return d.id })

    return chart
  }
}

// Modify the opacity of the bubbles  
function fade_bubble(name, svg, tip) {

  svg.selectAll("circle").attr("class", function (d) {
    if (d.Name == name) {
      tip.show(d, this);
      return "bubble_selected"
    }
    else {
      return "bubble_deselected"
    }
  })

  svg.selectAll("text").attr("class", function (d) {
    if (d.Name == name) {
      return "bubble_selected"
    }
    else {
      return "bubble_deselected"
    }
  })
}

// Reset the chart aspect
function reset_bubble(svg, tip) {
  svg.selectAll("circle").attr("class", "")
  svg.selectAll("text").attr("class", "")
  tip.hide()
}