function draw_sankey_chart(canvas) {

    canvas.select(".chart")
        .remove()

    var chart = canvas.append("g")
        .attr("class", "chart")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")") // Center the graph in the SVG

    chart.append("text")
        .attr("class", "text_rec")
        .attr("transform", "translate(" + (width + margin.left / 2) + ", " + (height / 2) + ") rotate(90)")
        .style("font-weight", "bold")
        .style("text-anchor", "middle")
        .text("Students Received");

    chart.append("text")
        .attr("class", "text_send")
        .attr("transform", "translate(" + (-margin.left / 1.6) + ", " + (height / 2) + ") rotate(-90)")
        .style("font-weight", "bold")
        .style("text-anchor", "middle")
        .text("Students Sent");

    chart.append("g")
        .attr("class", "sankey_chart")

    return chart;
}

function draw_sankey(chart, data) {

    // Making a transition is too slow

    // Calculate nodePadding
    var source_number = d3.nest()
        .key(function (d) { return d.source; })
        .entries(data.links)
    var target_number = d3.nest()
        .key(function (d) { return d.source; })
        .entries(data.links)
    var maxNodes = d3.max([source_number.length, target_number.length]);

    // Set the sankey diagram properties
    var sankey = d3.sankey()
        .nodeWidth(nodeWidth)
        .nodePadding(d3.min([10, (height - maxNodes) / maxNodes]))
        .size([width, height]);

    var path = sankey.link();

    sankey
        .nodes(data.nodes)
        .links(data.links)
        .layout(0); // Keep the order (don't calculate the optimal layout for less link interferences)


    // Sort countries according to their value
    nested = d3.nest()
        .key(function (d) { return d.group; })
        .map(data.nodes)

    var props = [nested.$send, nested.$rec]
    for (i = 0; i < 2; i++) {
        var gr = props[i]
        var y = (height - d3.sum(gr, function (d) { return d.dy + sankey.nodePadding(); })) / 2 + sankey.nodePadding() / 2; // Posición de inicio
        gr.sort(function (a, b) { return b.dy - a.dy; })
        gr.map(function (d) {
            d.y = y;
            y += d.dy + sankey.nodePadding();
        })
    }


    // Now, we sort the links so they don't interfere with the other links from the same node
    for (i = 0; i < 2; i++) {
        var gr = props[i]
        gr.map(function (node) {
            var ly = 0;
            node.sourceLinks
                .sort(function (a, b) { return a.target.y - b.target.y })
                .map(function (link) {
                    link.sy = ly;
                    ly += link.dy;
                })
            ly = 0
            node.targetLinks
                .sort(function (a, b) { return a.source.y - b.source.y })
                .forEach(function (link) {
                    link.ty = ly;
                    ly += link.dy;
                })
        })
    }


    if (currentbutton == "normalized") {

        chart.select(".text_rec")
            .text("Ratio of received students")

        chart.select(".text_send")
            .text("Ratio of sent students")
    }

    else if (currentbutton == "absolute") {

        chart.select(".text_rec")
            .text("Received students")

        chart.select(".text_send")
            .text("Sent students")
    }


    // Create the links
    var link_chart = chart.select(".sankey_chart")
        .append("g")
        .selectAll(".link")
        .data(data.links)

    link_chart.exit().remove()


    link_chart.enter()
        .append("path")
        .attr("class", "link")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", function (d) { return d.source.color })
        .style("stroke-width", function (d) { return Math.max(1, d.dy); })
        .sort(function (a, b) { return b.dy - a.dy; })
        .append("title")
        .text(function (d) {
            if (currentbutton == "absolute") {
                return (d.source.full_name + " → " + d.target.full_name + "\n" + d.value + " students")
            }
            else if (currentbutton == "normalized") {
                return (d.source.full_name + " → " + d.target.full_name + "\n" + d.value * 100 + " % of students")
            }
        })


    // Create the nodes
    var node_chart = chart.select(".sankey_chart")
        .append("g")
        .selectAll(".node")
        .data(data.nodes)

    node_chart.exit().remove()

    var newnode = node_chart.enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        })

        .on("click", function () {
            // It is different if the countries have already been filtered
            if (countries_filt == true) {
                selection_send = []
                selection_rec = []
                $("#filter_countries").css("display", "none")
                chart.select(".sankey_chart").selectAll("path").attr("class", "link")
                chart.select(".sankey_chart").selectAll(".node, .node_deselected, .node_selected").attr("class", "node")
                countries_filt = false
            }


            if (d3.select(this).classed("node_selected") == true) {

                if (this.__data__.group == "send") { selection_send = selection_send.filter(d => d !== this.__data__.name) } //Remove from the list
                else if (this.__data__.group == "rec") { selection_rec = selection_rec.filter(d => d !== this.__data__.name) } //Remove from the list

                d3.select(this).attr("class", "node_deselected");

                //Reset chart if no country is selected
                if (selection_send.length == 0 && selection_rec.length == 0) { reset_sankey(chart.select(".sankey_chart")) }

                // Fade the chart if there are still countries left
                else { fade_sankey(chart.select(".sankey_chart"), selection_send, selection_rec) }

            }

            else if ((d3.select(this).classed("node_deselected") == true) || (d3.select(this).classed("node") == true)) {

                if (this.__data__.group == "send") { selection_send.push(this.__data__.name) } // Add to the send list
                else if (this.__data__.group == "rec") { selection_rec.push(this.__data__.name) } // Add to the rec list

                d3.select(this).attr("class", "node_selected");
                fade_sankey(chart.select(".sankey_chart"), selection_send, selection_rec)
            }

        })

    newnode.append("rect")
    newnode.append("text") // Write the name of the country on the nodes (visible)
    newnode.append("title") // Add titles for the nodes (mouseover)


    node_chart.merge(newnode)
        .select("rect")
        .attr("height", function (d) { return d.dy; })
        .attr("width", sankey.nodeWidth())
        .style("stroke", "grey")
        .style("fill", function (d) { return d.color })

    node_chart.merge(newnode)
        .select("text")
        .attr("x", -6)
        .attr("class", "unselectable")
        .attr("y", function (d) { return d.dy / 2; })
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function (d) { return d.name; })
        .style("font-size", function () { // We want big typography whit few nodes and small with lots of nodes
            if ((nested.$send.length > 20) || (nested.$rec.length > 20)) { return "11px" }
            else { return "13px" }
        })

        .filter(function (d) { return d.x > width / 2; }) // We want both columns' names outside the graphic
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start")

    node_chart.merge(newnode)
        .select("title")
        .text(function (d, i) {
            if (currentbutton == "absolute") {
                return (d.full_name + "\n" + d.value + " students")
            }
            else if (currentbutton == "normalized") {
                return (d.full_name + "\n" + d.value * 100 + " % of students")
            }
        })


    return chart;
}



function fade_sankey(svg, selection_send, selection_rec) {

    //Show filter and reset buttons
    $("#filter_countries").css("display", "inline")
    $("#reset_countries").css("display", "inline")
    $("#reset_filters").addClass("reset_bt_active")

    svg.selectAll(".node, .node_deselected, .node_selected").attr("class", function (d) {

        if (d3.select(this).classed("node_selected") == true) {

            return "node_selected"
        }
        else {

            return "node_deselected"
        }
    })

    svg.selectAll(".link, .link_deselected, .link_selected").attr("class", function (d) {

        if (((selection_send.includes(d.source.name)) || (selection_rec.includes(d.target.name))) == false) {

            d3.select(this.firstChild).text("") //Don´t show the tooltip. .attr("pointer-events", "none") doesn´t work for title
            return "link_deselected"
        }

        if (((selection_send.includes(d.source.name)) || (selection_rec.includes(d.target.name))) == true) {

            d3.select(this.firstChild).text(function (d) { //Show the tooltip
                if (currentbutton == "absolute") {
                    return (d.source.full_name + " → " + d.target.full_name + "\n" + d.value + " students")
                }
                else if (currentbutton == "normalized") {
                    return (d.source.full_name + " → " + d.target.full_name + "\n" + d.value + ", ratio of students")
                }
            })
            return "link_selected"
        }
    })
}

// Reset the chart aspect
function reset_sankey(svg) {
    svg.selectAll("path").attr("class", "link")
    svg.selectAll(".node, .node_deselected, .node_selected").attr("class", "node")

    $("#filter_countries").css("display", "none")
    $("#reset_countries").css("display", "none")
}
