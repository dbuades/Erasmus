// Convert from full name to id
function reset_bubble(names) {
  svg.selectAll("circle").attr("class", "")
  svg.selectAll("text").attr("class", "")
  tip.hide()
}

function filter(data) {

  // Define the crossfilter
  var cf = crossfilter(data)

  // Define the filters
  var bySending = cf.dimension(function (d) { return d.Sending; });
  var byReceiving = cf.dimension(function (d) { return d.Receiving; });
  var byGender = cf.dimension(function (d) { return d.Gender; });
  var byCycle = cf.dimension(function (d) { return d.Cycle; });
  var bySession = cf.dimension(function (d) { return d.Session; });
  var byDomain = cf.dimension(function (d) { return d.Domain; });

  // Custom function to use arrays with Crossfilter
  function multivalue_filter(values) {
    return function (v) {
      return values.indexOf(v) !== -1;
    };
  }

  // Filter
  if (selection_send.length > 0) { bySending.filterFunction(multivalue_filter(selection_send)) };
  if (selection_rec.length > 0) { byReceiving.filterFunction(multivalue_filter(selection_rec)) };

  if (selection_gender.length > 0) { byGender.filterFunction(multivalue_filter(selection_gender)) };
  if (selection_cycle.length > 0) { byCycle.filterFunction(multivalue_filter(selection_cycle)) };
  if (selection_session.length > 0) { bySession.filterFunction(multivalue_filter(selection_session)) };
  if (selection_domain.length > 0) { byDomain.filterFunction(multivalue_filter(selection_domain)) };

  // Turn on or off the reset button
  if ( selection_send.length!=0 || selection_rec.length!=0 || selection_gender.length!=0 || selection_cycle.length!=0 || selection_session.length!=0 || selection_domain.length!=0) {
    $("#reset_filters").addClass("reset_bt_active")
  }
  else{
    $("#reset_filters").removeClass("reset_bt_active")
  }

  // Return the results after the filter
  return cf.allFiltered()
}



function prep_bubble(data, names) {

  // Count the sending and receving students for each country
  var sending = d3.nest()
    .key(function (d) {
      return d.Sending
    })
    .sortKeys(d3.ascending)
    .rollup(function (d) { return d.length })
    .entries(data)
    .map(function (d) {
      return {
        "id": d.key,
        "Sending": d.value,
      }
    })


  var receiving = d3.nest()
    .key(function (d) {
      return d.Receiving
    })
    .sortKeys(d3.ascending)
    .rollup(function (d) { return d.length })
    .entries(data)
    .map(function (d) {
      return {
        "id": d.key,
        "Receiving": d.value,
      }
    })

  // Merge both arrays
  map = new Map,
    merged = sending.concat(receiving).reduce(function (r, o) {
      var temp;
      if (map.has(o.id)) {
        Object.assign(map.get(o.id), o);
      } else {
        temp = Object.assign({}, o);
        map.set(temp.id, temp);
        r.push(temp);
      }
      return r;
    }, []);


  // Create and add the properties missing
  merged.map(function (d) {
    if (!d.hasOwnProperty("Sending"))
      d.Sending = 0;
    if (!d.hasOwnProperty("Receiving"))
      d.Receiving = 0;
  })

  // Add country properties from the .json
  _.map(merged, function (d) {
    return _.extend(d, _.find(names, { id: d.id }));
  });

  merged.map(function (d) {
    d.Sending_ratio = +d3.format(",.7f")(d.Sending / d.NStudents);
    d.Receiving_ratio = +d3.format(",.7f")(d.Receiving / d.NStudents);
  })

  return merged;
}




function prep_flow(data, names) {

  var i = 0
  var flow = [];

  d3.nest()
    .key(function (d) { return d.Sending })
    .sortKeys(d3.ascending)

    .key(function (d) { return d.Receiving })
    .sortKeys(d3.ascending)

    .entries(data)
    .map(function (d) {

      d.values.map(function (e) {

        flow[i] = {
          "Sending": d.key,
          "Receiving": e.key,
          "total": e.values.length,
          "ratio": +d3.format(",.7f")(e.values.length / (_.find(names, function (f) { if (f.id == d.key) return d })).NErasmus),
        }
        i++
      })
    })


  // Format data for Sankey diagramm that it's compatible with an Alluvial (entries repeated in two columns).

  var graph = { nodes: [], links: [] }
  var n = [], l = [];

  // Create two empty arrays for the nodes and the links
  // Depends if we want the absolute values or the normalized
  if (currentbutton == "absolute") {

    flow.map(function (d) {

      n.push({ name: d.Sending, group: "send" })
      n.push({ name: d.Receiving, group: "rec" })

      l.push({ source: d.Sending, target: d.Receiving, value: d.total })
    })

    n = d3.nest()
      .key(function (d) { return d.group })
      .entries(n)

    // Remove duplicates, count repetitions and sort according to repetitions for plotting them ordered on the graph
    n[0].values = d3.nest()
      .key(function (d) { return d.name; })
      .rollup(function (d) { return d.length })
      .entries(n[0].values)
      .sort(function (a, b) { return d3.descending(a.value, b.value); })

    n[1].values = d3.nest()
      .key(function (d) { return d.name; })
      .rollup(function (d) { return d.length })
      .entries(n[1].values)
      .sort(function (a, b) { return d3.descending(a.value, b.value); })
  }

  else if (currentbutton == "normalized") {

    flow.map(function (d) {

      n.push({ name: d.Sending, group: "send" })
      n.push({ name: d.Receiving, group: "rec" })

      l.push({ source: d.Sending, target: d.Receiving, value: d.ratio })
    })

    n = d3.nest()
      .key(function (d) { return d.group })
      .entries(n)


    n[0].values = d3.nest()
      .key(function (d) { return d.name; })
      .rollup(function () { return 0 })
      .entries(n[0].values)
      .sort(function (a, b) { return d3.descending(a.value, b.value); })

    n[0].values = n[0].values.map(function (d) {
      var sumsum = d3.sum(l.filter(function (e) { return e.source == d.key }), function (e) { return e.value });
      return {
        key: d.key,
        value: +d3.format(",.7f")(sumsum),
      }
    })

    n[1].values = d3.nest()
      .key(function (d) { return d.name; })
      .rollup(function () { return 0 })
      .entries(n[1].values)
      .sort(function (a, b) { return d3.descending(a.value, b.value); })

    n[1].values = n[1].values.map(function (d) {
      var sumsum = d3.sum(l.filter(function (e) { return e.target == d.key }), function (e) { return e.value });
      return {
        key: d.key,
        value: +d3.format(",.7f")(sumsum),
      }
    })

  }

  var i = 0;
  var nodes = [];
  n.map(function (d) {
    d.values.map(function (e) {

      nodes[i] = {
        "name": e.key,
        "count": e.value,
        "group": d.key,
        "color": (_.find(names, function (d) { if (d.id == e.key) return d })).Color,
        "full_name": (_.find(names, function (d) { if (d.id == e.key) return d })).Name
      }
      i++;
    })
  })

  //Substitute name by index position in node (different for sending and receiving) 
  l.forEach(function (d, i) {
    l[i].source = nodes.findIndex(x => (x.name == l[i].source) && (x.group == "send"))
    l[i].target = nodes.findIndex(x => (x.name == l[i].target) && (x.group == "rec"))
  })

  graph.nodes = nodes;
  graph.links = l;

  return graph;
}



function prep_group(data, direction) {

  var group = d3.nest()
    .key(function (d) {
      if (direction == "sending") { return d.Sending }
      else if (direction == "receiving") { return d.Receiving }
    })
    .sortKeys(d3.ascending)

    .entries(data)
    .map(function (d) {

      // Total students
      var total = d.values.length

      // Count the genre
      var genre = [0, 0];
      d.values.map(function (e) {
        if (e.Gender == "M") { genre[0]++ } else { genre[1]++ }
      })

      // Count the cycle
      var cycle = [0, 0, 0];
      d.values.map(function (e) {
        if (e.Cycle == "1") { cycle[0]++ } else if (e.Cycle == "2") { cycle[1]++ } else { cycle[2]++ }
      })

      // Count the session
      var session = [0, 0, 0];
      d.values.map(function (e) {
        if (e.Session == "1") { session[0]++ } else if (e.Session == "2") { session[1]++ } else { session[2]++ }
      })

      // Count the domains
      var domains = [0, 0, 0, 0, 0, 0, 0, 0];
      d.values.map(function (e) {
        if (e.Domain == "1") { domains[0]++ }
        else if (e.Domain == "2") { domains[1]++ }
        else if (e.Domain == "3") { domains[2]++ }
        else if (e.Domain == "4") { domains[3]++ }
        else if (e.Domain == "5") { domains[4]++ }
        else if (e.Domain == "6") { domains[5]++ }
        else if (e.Domain == "7") { domains[6]++ }
        else { domains[7]++ }
      })


      return {
        "id": d.key,
        "total": total,

        "genre": {
          male: genre[0],
          female: genre[1],
        },

        "cycle": {
          first: cycle[0],
          second: cycle[1],
          third: cycle[2],
        },

        "session": {
          year: session[0],
          autumn: session[1],
          spring: session[2],
        },

        "domains": {
          education: domains[0],
          humanities: domains[1],
          social: domains[2],
          science: domains[3],
          enigneering: domains[4],
          agriculture: domains[5],
          health: domains[6],
          services: domains[7],
        },
      }
    })

  return group;
}