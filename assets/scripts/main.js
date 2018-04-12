// Reset buttons to default before starting (Firefox refresh)
$("#sankey_bt").prop("checked", false);
$("#bubble_bt").prop("checked", true);
$(":checkbox:checked").prop("checked", false);
$("#search-bar input").val("");

// Arrays where we will add the countries to filter
var selection_send = []
var selection_rec = []

// Arrays with the other filters
var selection_gender = []
var selection_cycle = []
var selection_session = []
var selection_domain = []

// Tell if the countries have been filered
var countries_filt = false

// By default the data showing is "absolute"
var currentbutton = "absolute";

// By default the visualization showed is the bubble chart
var currentviz = "bubble"

// Dimensions
var margin = {
    top: 60,
    right: 100,
    bottom: 60,
    left: 100
};
var nodeWidth = 20 // Sankey

// Used to check if the window has really been resized
var windowWidth = Math.max($(window).width(),310)
var windowHeight = $(window).height()

// Initial draw
var svg_width = $("#viz_here").width() // First size
var svg_height = $(window).height()- 120

var width = svg_width - margin.left - margin.right
var height = svg_height - margin.top - margin.bottom

var canvas = d3.select("#viz_here").append("svg")
    .attr("width", svg_width)
    .attr("height", svg_height)
    .attr("class", "main_svg")

var border = canvas.append("rect")
    .attr("width", svg_width)
    .attr("height", svg_height)
    .style("fill", "none")
    .style("stroke", "black")
    .style("pointer-events", "all")
    .attr("class", "main_border")


// Redraw on resize
function resize_canvas() {

    // Update dimensions
    svg_width = $("#viz_here").width()
    svg_height = $(window).height() - 120
    width = svg_width - margin.left - margin.right
    height = svg_height - margin.top - margin.bottom

    // Resize old canvas
    d3.select(".main_svg")
        .attr("width", svg_width)
        .attr("height", svg_height)

    d3.select(".main_border")
        .attr("width", svg_width)
        .attr("height", svg_height)
}




// DATA LOADING //
Promise.all([
    d3.csv('./data/data.csv'),
    d3.json('./data/names.json')
])
    .then(([data, names]) => {

        data.map(function (d) {
            d.Cycle = +d.Cycle;
            d.Domain = +d.Domain;
            d.Session = +d.Session;
        });


        // Create the colors for each country
        names.map(function (d, i) {
            d.Color = d3.interpolateViridis(i / names.length)
        })

        // No filters at the beginning
        var filtered = data
        total_students.innerHTML = filtered.length

        // Start with bubble chart without filters by default
        var bubble = prep_bubble(filtered, names)
        var sankey = prep_flow(filtered, names);


        // We initially draw the bubble_chart
        var returns = draw_bubble_chart(canvas)
        var bubble_chart = returns[0]
        var xtext = returns[1]
        var ytext = returns[2]
        bubble_chart = draw_bubble(bubble_chart, bubble, xtext, ytext)


        /* 
          // Group by country (for a future map if we ever do it)
          var group = prep_group(filtered,"sending")
          console.log(group)
        */


        /////////////////BUTTONS LOGIC///////////////////////////

        $(document).ready(function () {

            // Redraw on resize

            $(window).resize(function () {

                // Check if the screen was really resized (avoid unwanted resize on touchscreens)
                if ( ($(window).width() != windowWidth) || ($(window).height() != windowHeight) ) {

                    windowWidth = $(window).width()
                    windowHeight = $(window).height()
                    
                    // Update dimensions and redraw
                    resize_canvas()


                    if (currentviz == "bubble") {

                        returns = draw_bubble_chart(canvas)
                        bubble_chart = returns[0]
                        xtext = returns[1]
                        ytext = returns[2]
                        bubble_chart = draw_bubble(bubble_chart, bubble, xtext, ytext, true)
                    }

                    else if (currentviz == "sankey") {
                        sankey_chart = draw_sankey_chart(canvas);
                        sankey_chart = draw_sankey(sankey_chart, sankey)
                    }
                }

            })


            // Absolute / Normalize

            $("#norm_bt").click(function () {
                currentbutton = "normalized"

                if (currentviz == "bubble") {
                    bubble_chart = draw_bubble(bubble_chart, bubble, xtext, ytext)
                }
                else if (currentviz == "sankey") {
                    filtered = filter(data) // For the sankey diagram, we need to refilter
                    sankey = prep_flow(filtered, names);
                    sankey_chart = draw_sankey_chart(canvas);
                    sankey_chart = draw_sankey(sankey_chart, sankey)
                }
            })


            $("#abs_bt").click(function () {
                currentbutton = "absolute"

                if (currentviz == "bubble") {
                    bubble_chart = draw_bubble(bubble_chart, bubble, xtext, ytext)
                }
                else if (currentviz == "sankey") {
                    filtered = filter(data)
                    sankey = prep_flow(filtered, names);
                    sankey_chart = draw_sankey_chart(canvas);
                    sankey_chart = draw_sankey(sankey_chart, sankey)
                }
            })


            //Get which viz to show

            // (Sankey/Alluvial) chart
            $("#sankey_bt").click(function () {
                currentviz = "sankey"

                sankey = prep_flow(filtered, names);

                sankey_chart = draw_sankey_chart(canvas);
                sankey_chart = draw_sankey(sankey_chart, sankey)
            })

            // Bubble chart
            $("#bubble_bt").click(function () {
                currentviz = "bubble"

                // Hide buttons for country filtering and reset
                $("#reset_countries").css("display", "none")
                $("#filter_countries").css("display", "none")

                // Remove countries selection
                selection_send = []
                selection_rec = []

                filtered = filter(data)
                total_students.innerHTML = filtered.length

                bubble = prep_bubble(filtered, names);

                returns = draw_bubble_chart(canvas)
                bubble_chart = returns[0]
                xtext = returns[1]
                ytext = returns[2]

                bubble_chart = draw_bubble(bubble_chart, bubble, xtext, ytext);
            })

            /////////////////FILTERS///////////////////////////

            // Get the gender
            $(".gender_bt").click(function () {

                selection_gender = $(".gender_bt input:checkbox:checked").map(function () {
                    return $(this).val();
                }).get();

                // Filter
                filtered = filter(data)
                total_students.innerHTML = filtered.length

                // Update the visualization
                if (currentviz == "bubble") {
                    bubble = prep_bubble(filtered, names);
                    bubble_chart = draw_bubble(bubble_chart, bubble, xtext, ytext);
                }

                else if (currentviz == "sankey") {
                    sankey = prep_flow(filtered, names);
                    sankey_chart = draw_sankey_chart(canvas);
                    sankey_chart = draw_sankey(sankey_chart, sankey)
                }               
            })

            // Get the cycle
            $(".cycle_bt").click(function () {

                selection_cycle = $(".cycle_bt input:checkbox:checked").map(function () {
                    return +$(this).val();
                }).get();

                filtered = filter(data)
                total_students.innerHTML = filtered.length

                if (currentviz == "bubble") {
                    bubble = prep_bubble(filtered, names);
                    bubble_chart = draw_bubble(bubble_chart, bubble, xtext, ytext);
                }

                else if (currentviz == "sankey") {
                    sankey = prep_flow(filtered, names);
                    sankey_chart = draw_sankey_chart(canvas);
                    sankey_chart = draw_sankey(sankey_chart, sankey)
                }
            })

            // Get the session
            $(".session_bt").click(function () {

                selection_session = $(".session_bt input:checkbox:checked").map(function () {
                    return +$(this).val();
                }).get();

                filtered = filter(data)
                total_students.innerHTML = filtered.length

                if (currentviz == "bubble") {
                    bubble = prep_bubble(filtered, names);
                    bubble_chart = draw_bubble(bubble_chart, bubble, xtext, ytext);
                }

                else if (currentviz == "sankey") {
                    sankey = prep_flow(filtered, names);
                    sankey_chart = draw_sankey_chart(canvas);
                    sankey_chart = draw_sankey(sankey_chart, sankey)
                }
            })


            // Get the domain
            $(".domain_bt").click(function () {

                selection_domain = $(".domain_bt input:checkbox:checked").map(function () {
                    return +$(this).val();
                }).get();

                filtered = filter(data)
                total_students.innerHTML = filtered.length

                if (currentviz == "bubble") {
                    bubble = prep_bubble(filtered, names);
                    bubble_chart = draw_bubble(bubble_chart, bubble, xtext, ytext);
                }

                else if (currentviz == "sankey") {
                    sankey = prep_flow(filtered, names);
                    sankey_chart = draw_sankey_chart(canvas);
                    sankey_chart = draw_sankey(sankey_chart, sankey)
                }
            })


            // Update countries on sankey chart
            document.getElementById("filter_countries").onclick = function () {

                if (currentviz == "sankey") {
                    $("#filter_countries").css("display", "none")

                    countries_filt = true

                    filtered = filter(data)
                    total_students.innerHTML = filtered.length

                    sankey = prep_flow(filtered, names);
                    sankey_chart = draw_sankey_chart(canvas);
                    sankey_chart = draw_sankey(sankey_chart, sankey)
                }
            }


            // Reset countries on sankey chart
            document.getElementById("reset_countries").onclick = function () {

                if (currentviz == "sankey") {

                    // Delete filters by country
                    countries_filt = false
                    selection_send = []
                    selection_rec = []

                    filtered = filter(data)
                    total_students.innerHTML = filtered.length

                    sankey = prep_flow(filtered, names);
                    sankey_chart = draw_sankey_chart(canvas);
                    sankey_chart = draw_sankey(sankey_chart, sankey)

                    $("#reset_countries").css("display", "none")
                    $("#filter_countries").css("display", "none")
                }
            }


            // Reset filters
            document.getElementById("reset_filters").onclick = function () {

                // Empty checkboxes
                $(":checkbox:checked").prop("checked", false);

                // Empty the filters
                selection_send = []
                selection_rec = []

                selection_gender = []
                selection_cycle = []
                selection_session = []
                selection_domain = []

                countries_filt = false

                filtered = filter(data);
                total_students.innerHTML = filtered.length

                if (currentviz == "bubble") {
                    $("#search-bar input").val("");
                    reset_bubble(bubble_chart.select(".bubble_chart"), tip_bubble)
                    bubble = prep_bubble(filtered, names);
                    bubble_chart = draw_bubble(bubble_chart, bubble, xtext, ytext);
                }

                else if (currentviz == "sankey") {
                    reset_sankey(sankey_chart.select(".sankey_chart"))
                    sankey = prep_flow(filtered, names);
                    sankey_chart = draw_sankey_chart(canvas);
                    sankey_chart = draw_sankey(sankey_chart, sankey)

                    $("#reset_countries").css("display", "none")
                    $("#filter_countries").css("display", "none")
                }
            }

        })




        ////////////////SEARCH SECTION///////////////////////////


        // AutoComplete
        new autoComplete({

            selector: "#search-bar input",
            minChars: 1,
            delay: 50, // Más rápido pero más carga
            source: function (term, response) {

                var values = [];
                term = term.toLowerCase();
                bubble.forEach(function (d) {
                    if (~d.Name.toLowerCase().indexOf(term)) {
                        values.push(d);
                    }
                });
                response(values);
            },

            renderItem: function (item, search) {
                search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
                return "<div class='autocomplete-suggestion' data-val='"
                    + item.Name + "'>" + item.Name.replace(re, "<b>$1</b>") + "</div>";
            },

            onSelect: function (event, term, item) {

                if (currentviz == "bubble") {
                    fade_bubble(item.getAttribute("data-val"), bubble_chart.select(".bubble_chart"), tip_bubble);
                }
                else if (currentviz == "sankey") {

                    // Get the id and add to the filter 
                    var country_id = (_.find(names, function (d) { if (d.Name == item.getAttribute("data-val")) return d })).id
                    selection_send.push(country_id)
                    selection_rec.push(country_id)

                    // We need to manually select the node (not included in fade_sankey) because we want both sides selected
                    sankey_chart.select(".sankey_chart").selectAll(".node, .node_deselected, .node_selected").attr("class", function (d) {

                        //console.log (d.name, country_id)
                        if ((d3.select(this).classed("node_selected") == true) || (d.name == country_id)) {
                            // console.log (d.name, country_id)
                            return "node_selected"
                        }
                        else {
                            return "node_deselected"
                        }

                    })

                    fade_sankey(sankey_chart.select(".sankey_chart"), selection_send, selection_rec);
                }
            }
        });


        // Each time that we write a letter on the search box
        var searchBarInput = d3.select("#search-bar input");
        searchBarInput.on("keydown", function () {
            if (d3.event.key === "Enter") {
                validateInput();
            } else {
                if (currentviz == "bubble") { reset_bubble(bubble_chart.select(".bubble_chart"), tip_bubble); }
                // else if (currentviz == "sankey") { reset_sankey(sankey_chart.select(".sankey_chart")); } // We don´t want to clean it each time in the Sankey
                searchBarInput.classed("error", false);
            }
        });

        // Each time that we click on the search button
        d3.select("#search-bar button")
            .on("click", validateInput)

        // Check if the input corresponds to a country
        function validateInput() {
            function normalize(str) {
                return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            }
            var value = searchBarInput.node().value.toLowerCase();
            if (!value) {
                return;
            }
            var currentValue = normalize(value);
            const countryFound = bubble.find(function (d) {
                return normalize(d.Name.toLowerCase()) === currentValue;
            });

            if (countryFound) {
                if (currentviz == "bubble") {
                    fade_bubble(countryFound.Name, bubble_chart.select(".bubble_chart"), tip_bubble)
                }
                else if (currentviz == "sankey") {
                    fade_sankey(sankey_chart.select(".sankey_chart"), selection_send, selection_rec);
                }
            }

            else {
                searchBarInput.classed("error", true);
            }
        }

        //////////////////////////////////////////////////////////////////////



    })