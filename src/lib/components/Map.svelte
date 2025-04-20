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
      .scale(1300)
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
            .style("font-size", "11px");
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
            .style("font-size", "11px");

          // Highlight this boundary
          d3.select(this).attr("stroke", "#ff6600").attr("stroke-width", 3);

          // Highlight the label too
          d3.select(`.state-label-${stateName.replace(/\s+/g, "-")}`)
            .style("font-weight", "bold")
            .style("fill", "#ffffff")
            .style("font-size", "14px");
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
      .text((d) => d.name)
      .attr("class", (d) => `state-label-${d.name.replace(/\s+/g, "-")}`)
      .style("fill", "#f0f0f0")
      .style("font-family", "Inter, sans-serif")
      .style("font-size", "11px")
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        // Enlarge text
        d3.select(this)
          .style("font-size", "14px")
          .style("fill", "#ffffff")
          .style("font-weight", "bold");

        // Highlight matching state outline
        d3.select(`.state-path-${d.name.replace(/\s+/g, "-")}`)
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 3);
      })
      .on("mouseout", function (event, d) {
        // Reset text style
        d3.select(this)
          .style("font-size", "11px")
          .style("fill", "#f0f0f0")
          .style("font-weight", "normal");

        // Reset path if not selected
        d3.select(`.state-path-${d.name.replace(/\s+/g, "-")}`)
          .attr("stroke", d.name === selectedState ? "#ff6600" : "#999")
          .attr("stroke-width", d.name === selectedState ? 3 : 1.5);
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
        } else {
          // Set new selected state
          selectedState.set(clickedState);
          selectedStateValue = clickedState;

          // Reset all first
          d3.selectAll(".state-path")
            .attr("stroke", "#999")
            .attr("stroke-width", 1.5);

          // Highlight selected path
          d3.select(`.state-path-${clickedState.replace(/\s+/g, "-")}`)
            .attr("stroke", "#ff6600")
            .attr("stroke-width", 3);
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
        .range([0.5, 5])
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

      return (
        inYearRange &&
        matchesCause &&
        matchesState &&
        matchesMonth &&
        matchesSelectedMY
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
    drawSizeLegend(svg);
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

  function drawSizeLegend(svg) {
    if (!sizeScale) return;

    const legendGroup = svg
      .append("g")
      .attr("id", "size-legend")
      .attr("transform", `translate(${svgElement.clientWidth - 340}, 230)`);

    legendGroup
      .append("rect")
      .attr("width", 230)
      .attr("height", 160)
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

    const sizes = [0.2, 0.5, 1].map((f) =>
      sizeScale.invert(f * sizeScale.range()[1])
    );

    sizes.forEach((size, i) => {
      const y = 70 + i * 35;
      legendGroup
        .append("circle")
        .attr("cx", 35)
        .attr("cy", y)
        .attr("r", sizeScale(size) * 3.5)
        .attr("fill", "#ff7800")
        .attr("opacity", 0.9);
      legendGroup
        .append("text")
        .attr("x", 75)
        .attr("y", y + 5)
        .attr("fill", "#fff")
        .attr("font-size", "18px")
        .text(`${Math.round(size)} acres`);
    });
  }

  // 🆕 Include $selectedMonthYear in the reactive redraw condition:
  $: if (
    $yearRange ||
    $selectedCauses ||
    selectedStateValue ||
    $selectedMonth !== null ||
    $selectedMonthYear !== null
  ) {
    drawFires();
  }

  $: {
    const [startYear, endYear] = $yearRange || [2000, 2025];

    filteredWildfires = allWildfires.filter((d) => {
      const inYearRange = d.year >= startYear && d.year <= endYear;
      const matchesCause =
        $selectedCauses.length === 0 || $selectedCauses.includes(d.cause);
      const matchesState = selectedStateValue
        ? d.state === stateAbbreviations[selectedStateValue]
        : true;

      return inYearRange && matchesCause && matchesState;
    });

    console.group("🔥 Wildfire Filter Debug");
    console.log("Selected State:", selectedStateValue || "None");
    console.log("Selected Causes:", $selectedCauses);
    console.log("Year Range:", $yearRange);
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
  /* Global styles to make page fill screen */
  :global(body),
  :global(html) {
    margin: 0;
    padding: 0;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background-color: "white";
  }

  /* Outer wrapper to control total layout */
  .page-wrapper {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .map-container {
    height: 50vh;
    width: 100%;
    border-bottom: 2px solid #444;
    background-color: #1e1e1e;
  }

  .bottom-charts {
    height: 50vh; /* 💥 force bottom to stay inside */
    display: flex;
    width: 100%;
    background-color: #1e1e1e;
  }

  .chart-wrapper {
    flex: 1;
    height: 100%;
    overflow: hidden; /* 💥 prevents D3 SVG from spilling out */
    position: relative;
  }

  .tooltip {
    position: fixed;
    background-color: rgba(30, 30, 30, 0.95);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-family: "Inter", sans-serif;
    pointer-events: none;
    z-index: 1000;
    border: 1px solid #555;
    white-space: nowrap;
  }
</style>
