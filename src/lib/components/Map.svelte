<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { feature } from "topojson-client";
  import wildfireCSV from "$lib/data/wildfire_clean.csv?url";
  import {
    yearRange,
    selectedCauses,
    selectedMonth,
    // 🆕 import this:
    selectedMonthYear,
  } from "$lib/stores/fireFilters";
  import TimeSeriesChart from "$lib/components/TimeSeriesChart.svelte";
  import CausePieChart from "$lib/components/CausePieChart.svelte";
  import MonthlyBarChart from "$lib/components/MonthlyBarChart.svelte";
  import { selectedState } from "$lib/stores/selectedState";
  import { derived } from "svelte/store";
  import { get } from "svelte/store"; // for reading store directly
  import { selectedSizeRange } from "$lib/stores/fireFilters"; //  import store

  const sizeRange = get(selectedSizeRange);

  const stateAbbreviations = {
    Alabama: "AL",
    Alaska: "AK",
    Arizona: "AZ",
    Arkansas: "AR",
    California: "CA",
    Colorado: "CO",
    Connecticut: "CT",
    Delaware: "DE",
    Florida: "FL",
    Georgia: "GA",
    Hawaii: "HI",
    Idaho: "ID",
    Illinois: "IL",
    Indiana: "IN",
    Iowa: "IA",
    Kansas: "KS",
    Kentucky: "KY",
    Louisiana: "LA",
    Maine: "ME",
    Maryland: "MD",
    Massachusetts: "MA",
    Michigan: "MI",
    Minnesota: "MN",
    Mississippi: "MS",
    Missouri: "MO",
    Montana: "MT",
    Nebraska: "NE",
    Nevada: "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    Ohio: "OH",
    Oklahoma: "OK",
    Oregon: "OR",
    Pennsylvania: "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    Tennessee: "TN",
    Texas: "TX",
    Utah: "UT",
    Vermont: "VT",
    Virginia: "VA",
    Washington: "WA",
    "West Virginia": "WV",
    Wisconsin: "WI",
    Wyoming: "WY",
  };

  let selectedStateValue: string | null = null;

  // Reactive subscription using $: label
  $: selectedState.subscribe((value) => {
    selectedStateValue = value;
  });

  let svgElement: SVGSVGElement;
  let g;
  let projection;
  let allWildfires = [];
  let filteredWildfires = [];
  let hoveredState: string | null = null;

  let sizeScale;
  let colorScale;
  let maxDuration;

  onMount(async () => {
    const svg = d3
      .select(svgElement)
      .attr("width", "100%")
      .attr("height", "100%")
      .style("background-color", "#1e1e1e")
      .style("border", "1px solid #444");

    const width = svgElement.clientWidth;
    const height = svgElement.clientHeight;

    const zoomGroup = svg.append("g").attr("class", "zoom-group");
    g = zoomGroup;

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", (event) => zoomGroup.attr("transform", event.transform));

    svg.call(zoom).on("wheel", function (event) {
      event.preventDefault();
      if (event.deltaY) {
        const direction = event.deltaY > 0 ? -1 : 1;
        const factor = direction * 0.2;
        const transform = d3.zoomTransform(this);
        const newScale = Math.max(1, Math.min(8, transform.k * (1 + factor)));
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;
        const newTransform = d3.zoomIdentity
          .translate(transform.x, transform.y)
          .scale(newScale)
          .translate(
            -(mouseX * (newScale / transform.k - 1)),
            -(mouseY * (newScale / transform.k - 1))
          );

        svg.transition().duration(200).call(zoom.transform, newTransform);
      }
    });

    projection = d3
      .geoAlbersUsa()
      .scale(1800)
      .translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    const [countiesTopo, statesTopo] = await Promise.all([
      d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"),
      d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
    ]);

    if (!countiesTopo || !statesTopo) return;

    const counties = feature(countiesTopo, countiesTopo.objects.counties);
    const states = feature(statesTopo, statesTopo.objects.states);

    g.append("g")
      .selectAll("path")
      .data(counties.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#2a2a2a")
      .attr("stroke", "#444")
      .attr("stroke-width", 0.3);

    const statePaths = g
      .append("g")
      .attr("class", "states")
      .selectAll("path")
      .data(states.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#999")
      .attr(
        "class",
        (d) => `state-path state-path-${d.properties.name.replace(/\s+/g, "-")}`
      )
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        hoveredState = d.properties.name;
        d3.select(this).attr("stroke-width", 3).attr("stroke", "#ffffff"); // Highlight on hover
      })
      .on("mouseout", function (event, d) {
        hoveredState = null;
        d3.select(this)
          .attr(
            "stroke-width",
            d.properties.name === selectedStateValue ? 3 : 1.5
          )
          .attr(
            "stroke",
            d.properties.name === selectedStateValue ? "#ff6600" : "#999"
          );
      })
      .on("click", function (event, d) {
        const stateName = d.properties.name;
        const isSelected = selectedStateValue === stateName;

        if (isSelected) {
          selectedState.set(null);
          selectedStateValue = null;

          // Reset all strokes
          d3.selectAll(".state-path")
            .attr("stroke", "#999")
            .attr("stroke-width", 1.5);

          d3.selectAll(".state-label")
            .style("font-weight", "normal")
            .style("fill", "#f0f0f0")
            .style("font-size", "14px");
        } else {
          selectedState.set(stateName);
          selectedStateValue = stateName;

          // Reset all strokes and labels
          d3.selectAll(".state-path")
            .attr("stroke", "#999")
            .attr("stroke-width", 1.5);

          d3.selectAll(".state-label")
            .style("font-weight", "normal")
            .style("fill", "#f0f0f0")
            .style("font-size", "14px");

          // Highlight this boundary
          d3.select(this).attr("stroke", "#ff6600").attr("stroke-width", 3);

          // Highlight the label too
          d3.select(`.state-label-${stateName.replace(/\s+/g, "-")}`)
            .style("font-weight", "bold")
            .style("fill", "#ffffff")
            .style("font-size", "16px");
        }

        console.log(
          "Clicked boundary:",
          stateName,
          "Selected now?",
          !isSelected
        );
      });

    const skipLabels = new Set([
      "Rhode Island",
      "Connecticut",
      "Delaware",
      "New Jersey",
      "Maryland",
      "District of Columbia",
      "New Hampshire",
    ]);

    const stateCentroids = states.features
      .filter((d) => !skipLabels.has(d.properties.name))
      .map((d) => ({ name: d.properties.name, coords: d3.geoCentroid(d) }))
      .filter((d) => projection(d.coords));

    const labelGroup = g.append("g").attr("class", "state-labels");

    labelGroup
      .selectAll("text")
      .data(stateCentroids)
      .enter()
      .append("text")
      .attr("x", (d) => projection(d.coords)?.[0])
      .attr("y", (d) => projection(d.coords)?.[1])
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .text((d) => stateAbbreviations[d.name] || d.name)
      .attr(
        "class",
        (d) => `state-label state-label-${d.name.replace(/\s+/g, "-")}`
      )
      .style("fill", "#f0f0f0")
      .style("font-family", "Inter, sans-serif")
      .style("font-size", "14px") // Default size
      .style("cursor", "pointer")
      .style("font-weight", "normal")
      .on("mouseover", function (event, d) {
        // Only enlarge if not already selected
        if (selectedStateValue !== d.name) {
          // Enlarge text
          d3.select(this)
            .style("font-size", "16px")
            .style("fill", "#ffffff")
            .style("font-weight", "bold");
        }

        // Highlight matching state outline
        d3.select(`.state-path-${d.name.replace(/\s+/g, "-")}`)
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 3);
      })
      .on("mouseout", function (event, d) {
        // Only reset if not the selected state
        if (selectedStateValue !== d.name) {
          // Reset text style to default
          d3.select(this)
            .style("font-size", "14px")
            .style("fill", "#f0f0f0")
            .style("font-weight", "normal");
        }

        // Reset path if not selected
        d3.select(`.state-path-${d.name.replace(/\s+/g, "-")}`)
          .attr("stroke", d.name === selectedStateValue ? "#ff6600" : "#999")
          .attr("stroke-width", d.name === selectedStateValue ? 3 : 1.5);
      })
      .on("click", function (event, d) {
        const clickedState = d.name;

        if (selectedStateValue === clickedState) {
          // Deselect if same state is clicked again
          selectedState.set(null);
          selectedStateValue = null;

          // Reset the path styling
          d3.selectAll(".state-path")
            .attr("stroke", "#999")
            .attr("stroke-width", 1.5);

          // Reset this label
          d3.select(this)
            .style("font-size", "14px")
            .style("font-weight", "normal")
            .style("fill", "#f0f0f0");
        } else {
          // Set new selected state
          selectedState.set(clickedState);
          selectedStateValue = clickedState;

          // Reset all first
          d3.selectAll(".state-path")
            .attr("stroke", "#999")
            .attr("stroke-width", 1.5);

          d3.selectAll(".state-label")
            .style("font-size", "14px")
            .style("font-weight", "normal")
            .style("fill", "#f0f0f0");

          // Highlight selected path
          d3.select(`.state-path-${clickedState.replace(/\s+/g, "-")}`)
            .attr("stroke", "#ff6600")
            .attr("stroke-width", 3);

          // Highlight this label
          d3.select(this)
            .style("font-size", "18px") // Make selected state larger
            .style("font-weight", "bold")
            .style("fill", "#ffffff");
        }
      });

    const julianToDate = (julian: number) => {
      const MS_PER_DAY = 86400000;
      const J1970 = 2440587.5;
      return new Date((julian - J1970) * MS_PER_DAY);
    };

    d3.csv(wildfireCSV, (d) => {
      const discoveryDate = julianToDate(+d.DISCOVERY_DATE);
      const contDate = julianToDate(+d.CONT_DATE);
      let duration = 0;

      if (
        !isNaN(discoveryDate.getTime()) &&
        !isNaN(contDate.getTime()) &&
        contDate >= discoveryDate
      ) {
        duration =
          (contDate.getTime() - discoveryDate.getTime()) /
          (1000 * 60 * 60 * 24);
      }

      return {
        latitude: +d.LATITUDE,
        longitude: +d.LONGITUDE,
        size: +d.FIRE_SIZE,
        cause: d.STAT_CAUSE_DESCR,
        discoveryDate,
        contDate,
        duration,
        state: d.STATE,
        county: d.COUNTY,
        year: +d.FIRE_YEAR,
      };
    }).then((data) => {
      allWildfires = data.filter(
        (d) =>
          !isNaN(d.latitude) &&
          !isNaN(d.longitude) &&
          d.latitude !== 0 &&
          d.longitude !== 0
      );

      const maxFireSize =
        d3.quantile(
          allWildfires.map((d) => d.size).sort(d3.ascending),
          0.995
        ) || 100;
      sizeScale = d3
        .scaleSqrt()
        .domain([0, maxFireSize])
        .range([0.5, 8])
        .clamp(true);

      maxDuration =
        d3.quantile(
          allWildfires.map((d) => d.duration).sort(d3.ascending),
          0.995
        ) || 30;
      colorScale = d3
        .scaleLinear<string>()
        .domain([0, maxDuration])
        .range(["#feb24c", "#ff0000"])
        .clamp(true);

      if ($yearRange) drawFires();
      drawLegends();
    });
  });

  function drawFires() {
    if (
      !g ||
      !projection ||
      allWildfires.length === 0 ||
      !$yearRange ||
      !$selectedCauses
    )
      return;

    const [startYear, endYear] = $yearRange;
    const sizeRange = get(selectedSizeRange);
    console.log("Drawing fires with filters:", {
      yearRange: [startYear, endYear],
      selectedCauses: $selectedCauses,
      selectedState: selectedStateValue,
    });

    const filtered = allWildfires.filter((d) => {
      const inYearRange = d.year >= startYear && d.year <= endYear;
      const matchesCause =
        $selectedCauses.length > 0 && $selectedCauses.includes(d.cause);
      const matchesState = selectedStateValue
        ? d.state === stateAbbreviations[selectedStateValue]
        : true;
      const matchesMonth =
        $selectedMonth === null ||
        (d.discoveryDate instanceof Date &&
          d.discoveryDate.getMonth() === $selectedMonth);

      // 🆕 But if $selectedMonthYear is set, then only show that single month+year:
      const matchesSelectedMY =
        $selectedMonthYear === null ||
        (d.discoveryDate instanceof Date &&
          d.discoveryDate.getFullYear() === $selectedMonthYear.getFullYear() &&
          d.discoveryDate.getMonth() === $selectedMonthYear.getMonth());

      const matchesSize =
        !sizeRange || (d.size >= sizeRange[0] && d.size <= sizeRange[1]); // 🆕

      return (
        inYearRange &&
        matchesCause &&
        matchesState &&
        matchesMonth &&
        matchesSelectedMY &&
        matchesSize
      );
    });

    console.log(
      `Filtered ${filtered.length} of ${allWildfires.length} wildfires for map display`
    );
    g.selectAll("circle").remove();

    g.selectAll("circle")
      .data(filtered)
      .enter()
      .append("circle")
      .attr("cx", (d) => projection([d.longitude, d.latitude])?.[0])
      .attr("cy", (d) => projection([d.longitude, d.latitude])?.[1])
      .attr("r", (d) => sizeScale(d.size) * 1.5)
      .attr("fill", (d) => (colorScale ? colorScale(d.duration) : "#ff7800"))
      .attr("opacity", 0.9)
      .style("cursor", "pointer") // Add hand cursor on hover
      .on("mouseover", function (event, d) {
        // Dim other circles
        g.selectAll("circle").attr("opacity", 0.3);

        // Highlight this one (bigger + full opacity, no stroke)
        d3.select(this)
          .raise()
          .attr("r", sizeScale(d.size) * 2)
          .attr("opacity", 1);

        // Tooltip with county included
        d3.select("#tooltip").style("display", "block").html(`
      <strong>🔥 Wildfire</strong><br/>
      <strong>Size:</strong> ${Math.round(d.size)} acres<br/>
      <strong>Duration:</strong> ${Math.round(d.duration)} days<br/>
      <strong>Cause:</strong> ${d.cause}<br/>
      <strong>State:</strong> ${d.state}<br/>
      <strong>County:</strong> ${d.county}<br/>
      <strong>Discovered:</strong> ${d.discoveryDate.toDateString()}<br/>
      <strong>Contained:</strong> ${d.contDate.toDateString()}
    `);
      })
      .on("mousemove", (event) => {
        d3.select("#tooltip")
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY + 15}px`);
      })
      .on("mouseout", function (event, d) {
        // Reset all circles
        g.selectAll("circle")
          .attr("r", (d) => sizeScale(d.size) * 1.5)
          .attr("opacity", 0.9);

        // Hide tooltip
        d3.select("#tooltip").style("display", "none");
      });

    // .on("mouseover", function (event, d) {
    //   g.selectAll("circle").attr("opacity", 0.3);
    //   d3.select(this)
    //     .raise()
    //     .attr("opacity", 1)
    //     .attr("stroke", "#fff")
    //     .attr("stroke-width", 2)
    //     .attr("r", sizeScale(d.size) * 2);
    //   // ...
    // });
    // .on("mouseout", function () {
    //   g.selectAll("circle").attr("opacity", 0.9);
    //   d3.select(this)
    //     .attr("stroke", "none")
    //     .attr("stroke-width", null)
    //     .attr("r", (d) => sizeScale(d.size) * 1.5);
    //   d3.select("#tooltip").style("display", "none");
    // });
  }

  function drawLegends() {
    d3.select("#duration-legend").remove();
    d3.select("#size-legend").remove();
    const svg = d3.select(svgElement);
    drawSizeLegend(svg, get(selectedSizeRange));
    drawDurationLegend(svg);
  }

  function drawDurationLegend(svg) {
    const legendGroup = svg
      .append("g")
      .attr("id", "duration-legend")
      .attr("transform", `translate(${svgElement.clientWidth - 340}, 120)`);

    legendGroup
      .append("rect")
      .attr("width", 320)
      .attr("height", 90)
      .attr("fill", "rgba(30, 30, 30, 0.8)")
      .attr("rx", 8)
      .attr("ry", 8);

    legendGroup
      .append("text")
      .attr("x", 20)
      .attr("y", 30)
      .attr("fill", "#fff")
      .attr("font-size", "22px")
      .attr("font-weight", "bold")
      .text("Fire Duration");

    const defs = legendGroup.append("defs");
    const gradientId = "legend-gradient-fixed";

    const gradient = defs
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("x2", "100%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ff9f00");
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#ff0000");

    legendGroup
      .append("rect")
      .attr("x", 20)
      .attr("y", 45)
      .attr("width", 280)
      .attr("height", 20)
      .style("fill", `url(#${gradientId})`);

    legendGroup
      .append("text")
      .attr("x", 20)
      .attr("y", 80)
      .attr("fill", "#fff")
      .attr("font-size", "18px")
      .text("Short (0 days)");

    legendGroup
      .append("text")
      .attr("x", 300)
      .attr("y", 80)
      .attr("fill", "#fff")
      .attr("font-size", "18px")
      .attr("text-anchor", "end")
      .text(`Long (${Math.round(maxDuration || 0)} days)`);
  }

  function drawSizeLegend(svg, currentSizeRange) {
    if (!sizeScale) return;

    const legendGroup = svg
      .append("g")
      .attr("id", "size-legend")
      .attr("transform", `translate(${svgElement.clientWidth - 340}, 230)`);

    // Define better spaced size ranges
    const sizes = [500, 5000, 25244]; // Using your exact values from the image

    const rect = legendGroup
      .append("rect")
      .attr("width", 230)
      .attr("height", 200) // Increased height to prevent overlapping
      .attr("fill", "rgba(30, 30, 30, 0.8)")
      .attr("rx", 8)
      .attr("ry", 8);

    legendGroup
      .append("text")
      .attr("x", 20)
      .attr("y", 30)
      .attr("fill", "#fff")
      .attr("font-size", "22px")
      .attr("font-weight", "bold")
      .text("Fire Size");

    // Add a display for the currently selected range (if any)
    const rangeText = legendGroup
      .append("text")
      .attr("x", 20)
      .attr("y", 55)
      .attr("fill", "#ff4500")
      .attr("font-weight", "bold")
      .attr("font-size", "16px");

    if (currentSizeRange) {
      rangeText.text(
        `${Math.round(currentSizeRange[0])} ≤ size ≤ ${Math.round(currentSizeRange[1])} acres`
      );
    } else {
      rangeText.text("All sizes shown");
    }

    // Store references to all circles for easier updating
    const circles = [];

    sizes.forEach((size, i) => {
      // Increase vertical spacing to prevent overlap
      const y = 90 + i * 55; // Increased from 35 to 45
      const r = sizeScale(size) * 3.5;

      // Define the range for this size category
      const rangeStart = i === 0 ? 0 : sizes[i - 1];
      const rangeEnd = size;

      const isSelected =
        currentSizeRange &&
        currentSizeRange[0] === rangeStart &&
        currentSizeRange[1] === rangeEnd;

      // Create the circle and store its reference
      const circle = legendGroup
        .append("circle")
        .attr("cx", 35)
        .attr("cy", y)
        .attr("r", r)
        .attr("fill", isSelected ? "#ff4500" : "#ff7800") // Reddish-orange when selected
        .attr("opacity", 0.9)
        .attr("stroke", isSelected ? "#fff" : "none")
        .attr("stroke-width", isSelected ? 3 : 0)
        .style("cursor", "pointer")
        .attr("data-index", i) // Store index for reference
        .on("click", function () {
          // Use function() to access 'this'
          const current = get(selectedSizeRange);
          const newRange = [rangeStart, rangeEnd];
          const clickedCircle = this;

          // Toggle logic
          if (
            current &&
            current[0] === newRange[0] &&
            current[1] === newRange[1]
          ) {
            // Deselect this range
            selectedSizeRange.set(null);
            rangeText.text("All sizes shown");

            // Reset this circle's appearance
            d3.select(clickedCircle)
              .attr("fill", "#ff7800")
              .attr("stroke", "none")
              .attr("stroke-width", 0);
          } else {
            // Select this range
            selectedSizeRange.set(newRange);
            rangeText.text(
              `${Math.round(rangeStart)} ≤ size ≤ ${Math.round(rangeEnd)} acres`
            );

            // Reset all circles first
            circles.forEach((c) => {
              d3.select(c)
                .attr("fill", "#ff7800")
                .attr("stroke", "none")
                .attr("stroke-width", 0);
            });

            // Then highlight this circle
            d3.select(clickedCircle)
              .attr("fill", "#ff4500")
              .attr("stroke", "#fff")
              .attr("stroke-width", 3);
          }

          // We don't need to call drawLegends() which would redraw everything
          // and potentially cause flickering - we're updating directly
        });

      circles.push(circle.node()); // Store DOM element reference

      // Range text next to each circle
      legendGroup
        .append("text")
        .attr("x", 75)
        .attr("y", y + 5)
        .attr("fill", "#fff")
        .attr("font-size", "18px")
        .text(`${rangeStart} - ${size} acres`);
    });

    // Add this section if you want a "Reset" button
    legendGroup
      .append("rect")
      .attr("x", 20)
      .attr("y", 230)
      .attr("width", 190)
      .attr("height", 30)
      .attr("fill", "#555")
      .attr("rx", 4)
      .attr("ry", 4)
      .style("cursor", "pointer")
      .on("click", function () {
        // Clear the selection
        selectedSizeRange.set(null);
        rangeText.text("All sizes shown");

        // Reset all circles
        circles.forEach((c) => {
          d3.select(c)
            .attr("fill", "#ff7800")
            .attr("stroke", "none")
            .attr("stroke-width", 0);
        });
      });

    legendGroup
      .append("text")
      .attr("x", 115)
      .attr("y", 250)
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", "14px")
      .text("Reset Size Filter")
      .style("pointer-events", "none");
  }

  // 🆕 Include $selectedMonthYear in the reactive redraw condition:
  $: if (
    $yearRange ||
    $selectedCauses ||
    selectedStateValue ||
    $selectedMonth !== null ||
    $selectedMonthYear !== null ||
    $selectedSizeRange !== null
  ) {
    drawFires();
  }
  // $: $selectedSizeRange; // reactive dependency
  // drawLegends();

  $: {
    const [startYear, endYear] = $yearRange || [2000, 2025];
    const sizeRange = get(selectedSizeRange); // ✅ include sizeRange

    filteredWildfires = allWildfires.filter((d) => {
      const inYearRange = d.year >= startYear && d.year <= endYear;
      const matchesCause =
        $selectedCauses.length === 0 || $selectedCauses.includes(d.cause);
      const matchesState = selectedStateValue
        ? d.state === stateAbbreviations[selectedStateValue]
        : true;
      const matchesSize =
        !sizeRange || (d.size >= sizeRange[0] && d.size <= sizeRange[1]); // ✅ add this

      return inYearRange && matchesCause && matchesState && matchesSize;
    });

    console.group("🔥 Wildfire Filter Debug");
    console.log("Selected State:", selectedStateValue || "None");
    console.log("Selected Causes:", $selectedCauses);
    console.log("Year Range:", $yearRange);
    console.log("Size Range:", sizeRange || "None");
    console.log("All Wildfires (Map):", allWildfires.length);
    console.log("Filtered Wildfires (Charts):", filteredWildfires.length);
    console.groupEnd();
  }

  $: filteredDataForCharts = filteredWildfires;
</script>

<div class="page-wrapper">
  <div class="map-container">
    <svg bind:this={svgElement}></svg>
  </div>

  {#if allWildfires.length > 0}
    <div class="bottom-charts">
      <div class="chart-wrapper">
        <TimeSeriesChart wildfireData={filteredDataForCharts} />
      </div>
      <div class="chart-wrapper">
        <MonthlyBarChart wildfireData={filteredDataForCharts} />
      </div>
    </div>
  {/if}

  <div id="tooltip" class="tooltip" style="display: none;"></div>
</div>

<style>
  .page-wrapper {
    display: grid;
    /* grid-template-rows: 1fr 1fr; map vs. charts */
    grid-template-rows: 60% 40%; /* More room for the map */
    gap: var(--spacing-lg);
    height: 100%;
    width: 100%;
    padding: var(--spacing-md);
    box-sizing: border-box;

    min-height: 0;
  }

  .map-container {
    padding: var(--spacing-sm);
    background-color: #1e1e1e;
    /* border: 1px solid #444; */
    border-radius: 0.5rem;
  }

  .bottom-charts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
    overflow: hidden;
  }

  .chart-wrapper {
    padding: var(--spacing-sm);
    border: 1px solid #444;
    border-radius: 0.5rem;
    overflow: hidden;
    background-color: #1e1e1e;

    min-height: 0;
    overflow: hidden;
  }

  .tooltip {
    position: fixed;
    background-color: rgba(30, 30, 30, 0.95);
    color: #fff;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: 0.25rem;
    font-size: 0.875rem; /* 14px */
    line-height: 1.4;
    pointer-events: none;
    z-index: 1000;
    border: 1px solid #555;
    white-space: nowrap;
  }
</style>
