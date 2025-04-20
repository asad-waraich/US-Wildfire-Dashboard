<script lang="ts">
  import { hoveredMonth, selectedMonth } from "$lib/stores/fireFilters";

  import { onMount } from "svelte";
  import * as d3 from "d3";
  import {
    yearRange,
    selectedCauses,
    selectedState,
  } from "$lib/stores/fireFilters";

  export let wildfireData = [];

  let container: HTMLDivElement;

  // Stores
  let currentSelectedState = "None";
  let currentYearRange = [2000, 2020];
  let currentSelectedCauses: string[] = [];

  // 🔁 Dynamically filtered data
  let filteredData = [];

  // 🧠 Reactive filtering block — updated when stores or data change
  $: {
    filteredData = wildfireData.filter((d) => {
      const discoveryDate =
        typeof d.discoveryDate === "string"
          ? new Date(d.discoveryDate)
          : d.discoveryDate;

      return (
        discoveryDate instanceof Date &&
        !isNaN(discoveryDate.getTime()) &&
        d.year >= currentYearRange[0] &&
        d.year <= currentYearRange[1] &&
        currentSelectedCauses.includes(d.cause) &&
        (!currentSelectedState ||
          currentSelectedState === "None" ||
          d.state === currentSelectedState)
      );
    });

    console.log(
      `[MonthlyBarChart] Filtered ${filteredData.length} records with:`,
      {
        currentYearRange,
        currentSelectedCauses,
        currentSelectedState,
      }
    );

    requestAnimationFrame(() => draw());
  }

  function draw() {
    if (!container) return;
    d3.select(container).selectAll("*").remove();

    const margin = { top: 40, right: 30, bottom: 60, left: 70 };
    const innerHeight = 600 - margin.top - margin.bottom;
    const innerWidth = container.clientWidth - margin.left - margin.right;

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", innerWidth + margin.left + margin.right)
      .attr("height", innerHeight + margin.top + margin.bottom)
      .style("background-color", "#1e1e1e")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Calculate counts AND total area by month
    const dataByMonth = d3
      .rollups(
        filteredData,
        (v) => ({
          count: v.length,
          // Assuming fireSize or acres is the field for area burnt
          // Update this field name if it's different in your data
          totalArea: d3.sum(
            v,
            (d) => d.fireSize || d.acres || d.burnedArea || 0
          ),
        }),
        (d) => {
          const date =
            typeof d.discoveryDate === "string"
              ? new Date(d.discoveryDate)
              : d.discoveryDate;
          return date.getMonth();
        }
      )
      .map(([monthIndex, data]) => ({
        month: monthNames[monthIndex],
        count: data.count,
        totalArea: data.totalArea,
        monthIndex: monthIndex,
      }))
      .sort(
        (a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month)
      );

    const x = d3
      .scaleBand()
      .domain(dataByMonth.map((d) => d.month))
      .range([0, innerWidth])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(dataByMonth, (d) => d.count) || 1])
      .nice()
      .range([innerHeight, 0]);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(30, 30, 30, 0.95)")
      .style("color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "13px")
      .style("font-family", "Inter, sans-serif")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("border", "1px solid #555");

    // Axes & Labels
    svg
      .append("g")
      .call(d3.axisLeft(y).ticks(5))
      .attr("color", "#aaa")
      .selectAll("text")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");

    svg
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .attr("color", "#aaa")
      .selectAll("text")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");

    // Create info display for selected/hovered month
    const infoBox = svg
      .append("g")
      .attr("class", "info-box")
      .attr("transform", `translate(${innerWidth - 200}, 20)`)
      .style("visibility", "hidden");

    infoBox
      .append("rect")
      .attr("width", 190)
      .attr("height", 80)
      .attr("fill", "rgba(30, 30, 30, 0.8)")
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("stroke", "#444")
      .attr("stroke-width", 1);

    const infoTitle = infoBox
      .append("text")
      .attr("x", 10)
      .attr("y", 25)
      .attr("fill", "#fff")
      .attr("font-size", "16px")
      .attr("font-weight", "bold");

    const infoCount = infoBox
      .append("text")
      .attr("x", 10)
      .attr("y", 45)
      .attr("fill", "#fff")
      .attr("font-size", "14px");

    const infoArea = infoBox
      .append("text")
      .attr("x", 10)
      .attr("y", 65)
      .attr("fill", "#ff7800")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");

    // Function to update info display
    function updateInfoDisplay(d) {
      infoTitle.text(`${d.month} Summary`);
      infoCount.text(`Fires: ${d.count.toLocaleString()}`);

      // Format area with appropriate units
      let areaDisplay;
      if (d.totalArea >= 1000000) {
        areaDisplay = `${(d.totalArea / 1000000).toFixed(2)} million acres`;
      } else if (d.totalArea >= 1000) {
        areaDisplay = `${(d.totalArea / 1000).toFixed(2)} thousand acres`;
      } else {
        areaDisplay = `${d.totalArea.toFixed(2)} acres`;
      }

      infoArea.text(`Area burnt: ${areaDisplay}`);
      infoBox.style("visibility", "visible");
    }

    // Bars
    svg
      .selectAll(".bar-group")
      .data(dataByMonth)
      .enter()
      .append("g")
      .attr("class", "bar-group")
      .each(function (d) {
        const group = d3.select(this);

        group
          .append("rect")
          .attr("x", x(d.month))
          .attr("y", y(d.count))
          .attr("width", x.bandwidth())
          .attr("height", innerHeight - y(d.count))
          .attr("fill", "#ff7800")
          .attr("opacity", 0.85)
          .on("mouseover", function (event) {
            tooltip
              .style("visibility", "visible")
              .html(
                `<strong>${d.month}</strong><br>${d.count} fires<br><strong>${d.totalArea.toLocaleString()} acres burnt</strong>`
              )
              .style("left", `${event.pageX + 15}px`)
              .style("top", `${event.pageY - 15}px`);

            if ($selectedMonth !== d.monthIndex) {
              d3.select(this).attr("fill", "#ff3300");
            }

            hoveredMonth.set(d.monthIndex);
            updateInfoDisplay(d);
          })
          .on("mouseout", function () {
            tooltip.style("visibility", "hidden");

            // Only reset if this bar is not selected
            if ($selectedMonth !== d.monthIndex) {
              d3.select(this).attr("fill", "#ff7800");

              // Only hide info box if nothing is selected
              if ($selectedMonth === null) {
                infoBox.style("visibility", "hidden");
              } else {
                // Show the selected month's data
                const selectedData = dataByMonth.find(
                  (d) => d.monthIndex === $selectedMonth
                );
                if (selectedData) {
                  updateInfoDisplay(selectedData);
                }
              }
            }

            hoveredMonth.set(null);
          })
          .on("click", function () {
            selectedMonth.update((current) => {
              if (current === d.monthIndex) {
                infoBox.style("visibility", "hidden");
                return null;
              } else {
                updateInfoDisplay(d);
                return d.monthIndex;
              }
            });
          });
      });

    // Update the info display for selected month on initialization
    if ($selectedMonth !== null) {
      const selectedData = dataByMonth.find(
        (d) => d.monthIndex === $selectedMonth
      );
      if (selectedData) {
        updateInfoDisplay(selectedData);
      }
    }

    // Title & Axis Labels
    svg
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "30px")
      .attr("font-weight", "bold")
      .text("Total Wildfires by Month (Selected Years)");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "24px")
      .text("Number of Wildfires");

    svg
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 45)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "24px")
      .text("Month");
  }

  onMount(() => {
    window.addEventListener("resize", draw);

    const unsub1 = yearRange.subscribe((val) => {
      currentYearRange = val;
    });

    const unsub2 = selectedCauses.subscribe((val) => {
      currentSelectedCauses = val;
    });

    const unsub3 = selectedState.subscribe((val) => {
      currentSelectedState = val;
    });

    // Initial draw
    draw();

    return () => {
      unsub1();
      unsub2();
      unsub3();
      window.removeEventListener("resize", draw);
    };
  });
</script>

<div bind:this={container} class="chart-container"></div>

<style>
  .chart-container {
    width: 100%;
    height: 100%;
    overflow: hidden; /* 🔐 lock chart inside */
    box-sizing: border-box;
  }
</style>
