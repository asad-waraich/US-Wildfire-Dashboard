<script lang="ts">
  import { onMount } from "svelte";
  import {
    yearRange,
    selectedCauses,
    selectedMonthYear,
  } from "$lib/stores/fireFilters";
  import * as d3 from "d3";

  export let wildfireData = [];

  let container: HTMLDivElement;

  // Keep track of filters
  let currentYearRange = [2000, 2020];
  let currentSelectedCauses: string[] = [];

  // For date formatting/parsing
  const formatMonth = d3.timeFormat("%Y-%m");
  const parseMonth = d3.timeParse("%Y-%m");

  // The data structure used by the chart: grouped by cause
  // Each cause -> array of { date, count, area }
  let groupedByCause: Record<
    string,
    { date: Date; count: number; area: number }[]
  > = {};

  // The store value for selectedMonthYear
  let selectedMY: Date | null = null;

  // Subscribe to selectedMonthYear at top-level so chart re-draws
  const unsubscribeSelectedMY = selectedMonthYear.subscribe((value) => {
    selectedMY = value;
    requestAnimationFrame(() => draw());
  });

  // Log whenever new data or filters arrive
  $: {
    console.log(
      `Time series received ${wildfireData?.length || 0} data points`
    );
    if (currentYearRange && currentSelectedCauses) {
      const [start, end] = currentYearRange;
      const filtered = wildfireData.filter(
        (d) =>
          d.year >= start &&
          d.year <= end &&
          currentSelectedCauses.includes(d.cause)
      );
      console.log(`After filtering: ${filtered?.length || 0} data points`);
    }
  }

  // Re-draw when wildfireData changes
  $: if (wildfireData) {
    console.log(
      `[TimeSeriesChart] wildfireData updated: ${wildfireData.length} records`
    );
    requestAnimationFrame(() => {
      draw();
    });
  }

  /**
   * Prepare data by grouping and binning both counts and total acres burned
   */
  function prepareData() {
    const [startYear, endYear] = currentYearRange;
    const causes = currentSelectedCauses;
    groupedByCause = {};

    // Filter out only valid records in the selected year range
    const filteredAll = wildfireData.filter(
      (d) =>
        d.year >= startYear &&
        d.year <= endYear &&
        d.discoveryDate instanceof Date &&
        !isNaN(d.discoveryDate.getTime())
    );

    // 1) Compute binned "Total" by month — aggregator has both count and total area
    const binnedTotal = d3
      .rollups(
        filteredAll,
        (v) => ({
          count: v.length,
          area: d3.sum(v, (d) => d.size),
        }),
        (d) => formatMonth(d.discoveryDate)
      )
      .sort(([a], [b]) => d3.ascending(a, b))
      .map(([monthStr, { count, area }]) => ({
        date: parseMonth(monthStr),
        count,
        area,
      }));

    // 2) Fill in missing months for "Total"
    if (binnedTotal.length > 1) {
      const allMonths = [];
      const start = binnedTotal[0].date;
      const end = binnedTotal[binnedTotal.length - 1].date;
      let current = new Date(start);
      while (current <= end) {
        allMonths.push(formatMonth(current));
        current.setMonth(current.getMonth() + 1);
      }
      groupedByCause["Total"] = allMonths.map((month) => {
        const found = binnedTotal.find((d) => formatMonth(d.date) === month);
        return (
          found || {
            date: parseMonth(month),
            count: 0,
            area: 0,
          }
        );
      });
    } else {
      groupedByCause["Total"] = binnedTotal;
    }

    // 3) For each selected cause, compute bin (count, area) + fill missing months
    causes.forEach((cause) => {
      const filtered = filteredAll.filter((d) => d.cause === cause);
      if (filtered.length === 0) return;

      const binned = d3
        .rollups(
          filtered,
          (v) => ({
            count: v.length,
            area: d3.sum(v, (d) => d.size),
          }),
          (d) => formatMonth(d.discoveryDate)
        )
        .sort(([a], [b]) => d3.ascending(a, b))
        .map(([monthStr, { count, area }]) => ({
          date: parseMonth(monthStr),
          count,
          area,
        }));

      // Reuse the "Total" array of dates to fill missing months
      const allMonths = groupedByCause["Total"].map((d) => formatMonth(d.date));
      groupedByCause[cause] = allMonths.map((month) => {
        const found = binned.find((d) => formatMonth(d.date) === month);
        return (
          found || {
            date: parseMonth(month),
            count: 0,
            area: 0,
          }
        );
      });
    });
  }

  onMount(() => {
    // Initial draw
    requestAnimationFrame(() => {
      draw();
    });

    // Subscribe to stores
    const unsubscribe1 = yearRange.subscribe((val) => {
      console.log(`[TimeSeriesChart] yearRange updated:`, val);
      currentYearRange = val;
      requestAnimationFrame(() => {
        draw();
      });
    });

    const unsubscribe2 = selectedCauses.subscribe((val) => {
      console.log(`[TimeSeriesChart] selectedCauses updated:`, val);
      currentSelectedCauses = val;
      requestAnimationFrame(() => {
        draw();
      });
    });

    const unsubscribe3 = selectedMonthYear.subscribe((value) => {
      selectedMY = value;
      requestAnimationFrame(() => draw());
    });

    // Resize handler
    const handleResize = () => {
      requestAnimationFrame(() => {
        draw();
      });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
      window.removeEventListener("resize", handleResize);
    };
  });

  function draw() {
    if (!container || !currentYearRange) return;

    // 1) If no causes, draw an empty chart
    if (!currentSelectedCauses || currentSelectedCauses.length === 0) {
      d3.select(container).selectAll("*").remove();

      // Create empty chart with message
      const margin = { top: 40, right: 40, bottom: 70, left: 220 };
      const width = container.clientWidth - margin.left - margin.right;
      const height = 600 - margin.top - margin.bottom;

      const svg = d3
        .select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background-color", "#1e1e1e")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Add glow filter
      const defs = svg.append("defs");
      const filter = defs.append("filter").attr("id", "glow");
      filter
        .append("feGaussianBlur")
        .attr("stdDeviation", 3)
        .attr("result", "blur");
      filter
        .append("feMerge")
        .selectAll("feMergeNode")
        .data(["blur", "SourceGraphic"])
        .enter()
        .append("feMergeNode")
        .attr("in", (d) => d);

      const x = d3
        .scaleTime()
        .domain([
          new Date(currentYearRange[0], 0, 1),
          new Date(currentYearRange[1], 11, 31),
        ])
        .range([0, width]);

      const y = d3.scaleLinear().domain([0, 10]).range([height, 0]);

      // Y-axis
      svg
        .append("g")
        .call(d3.axisLeft(y).ticks(5))
        .attr("color", "#aaa")
        .attr("font-size", "12px")
        .call((g) =>
          g
            .selectAll(".tick line")
            .clone()
            .attr("x2", width)
            .attr("stroke-opacity", 0.1)
        );

      // X-axis
      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(
          d3
            .axisBottom(x)
            .ticks(d3.timeMonth.every(3))
            .tickFormat(d3.timeFormat("Q%q %Y"))
        )
        .attr("color", "#aaa")
        .attr("font-size", "12px")
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      // Title
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .attr("fill", "#ffffff")
        .attr("font-size", "30px")
        .attr("font-weight", "bold")
        .text("Wildfire Frequency by Cause Over Time");

      // Centered message
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#888")
        .attr("font-size", "24px")
        .text("No data available for this selection");
      return;
    }

    // 2) Prepare data
    prepareData();

    // Clear
    d3.select(container).selectAll("*").remove();
    const allData = Object.values(groupedByCause).flat();
    if (allData.length === 0) {
      // Same fallback for empty data
      const margin = { top: 40, right: 40, bottom: 70, left: 220 };
      const width = container.clientWidth - margin.left - margin.right;
      const height = 600 - margin.top - margin.bottom;

      const svg = d3
        .select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background-color", "#1e1e1e")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3
        .scaleTime()
        .domain([
          new Date(currentYearRange[0], 0, 1),
          new Date(currentYearRange[1], 11, 31),
        ])
        .range([0, width]);

      const y = d3.scaleLinear().domain([0, 10]).range([height, 0]);

      svg
        .append("g")
        .call(d3.axisLeft(y).ticks(5))
        .attr("color", "#aaa")
        .attr("font-size", "12px")
        .call((g) =>
          g
            .selectAll(".tick line")
            .clone()
            .attr("x2", width)
            .attr("stroke-opacity", 0.1)
        );

      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(
          d3
            .axisBottom(x)
            .ticks(d3.timeMonth.every(3))
            .tickFormat(d3.timeFormat("Q%q %Y"))
        )
        .attr("color", "#aaa")
        .attr("font-size", "12px")
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      // Y-label
      svg
        .append("text")
        .attr("x", -height)
        .attr("y", -50)
        .attr("transform", "rotate(-90)")
        .attr("fill", "#ffffff")
        .attr("font-size", "24px")
        .attr("font-weight", "bold")
        .style("text-anchor", "middle")
        .text("# Fires");

      // X-label
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + 60)
        .attr("fill", "#ffffff")
        .attr("font-size", "24px")
        .attr("font-weight", "bold")
        .style("text-anchor", "middle")
        .text("Date");

      // Title
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .attr("fill", "#ffffff")
        .attr("font-size", "30px")
        .attr("font-weight", "bold")
        .text("Wildfire Frequency by Cause Over Time");

      // Message
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#888")
        .attr("font-size", "24px")
        .text("No data available for this selection");
      return;
    }

    // 3) Create a tooltip div if it doesn't exist
    if (d3.select("#chart-tooltip").empty()) {
      d3.select("body")
        .append("div")
        .attr("id", "chart-tooltip")
        .attr("class", "tooltip")
        .style("visibility", "hidden")
        .style("position", "absolute")
        .style("background", "rgba(30, 30, 30, 0.95)")
        .style("color", "white")
        .style("padding", "8px 12px")
        .style("border-radius", "6px")
        .style("font-size", "13px")
        .style("font-family", "Inter, sans-serif")
        .style("pointer-events", "none")
        .style("z-index", "1000")
        .style("border", "1px solid #555")
        .style("white-space", "nowrap");
    }

    // 4) Chart dimensions
    const margin = { top: 40, right: 40, bottom: 70, left: 220 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .style("background-color", "#1e1e1e")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X domain: date extent
    const dateExtent = d3.extent(allData, (d) => d.date) as [Date, Date];
    const x = d3.scaleTime().domain(dateExtent).range([0, width]);

    // Y domain: max count
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(allData, (d) => d.count) * 1.1 || 10])
      .range([height, 0]);

    // Color scale for each cause
    const color = d3
      .scaleOrdinal()
      .domain(Object.keys(groupedByCause))
      .range([
        "#ff7800",
        "#ff0000",
        "#4daf4a",
        "#377eb8",
        "#984ea3",
        "#ff9f00",
        "#e41a1c",
        "#a65628",
        "#f781bf",
        "#999999",
      ]);

    // Line dash patterns
    const dashPatterns = { Total: "" }; // Solid line for 'Total'
    let dashIndex = 0;
    const dashOptions = ["5,5", "2,2", "10,5", "5,2,2,2", "8,3,2,3", "1,3"];
    Object.keys(groupedByCause).forEach((cause) => {
      if (cause !== "Total") {
        dashPatterns[cause] = dashOptions[dashIndex % dashOptions.length];
        dashIndex++;
      }
    });

    // Add axes
    svg
      .append("g")
      .call(d3.axisLeft(y).ticks(5))
      .attr("color", "#aaa")
      .attr("font-size", "12px")
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("x2", width)
          .attr("stroke-opacity", 0.1)
      );

    // Show quarterly ticks
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(d3.timeMonth.every(3))
          .tickFormat(d3.timeFormat("Q%q %Y"))
      )
      .attr("color", "#aaa")
      .attr("font-size", "12px")
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Y-axis label
    svg
      .append("text")
      .attr("x", -height / 2)
      .attr("y", -40)
      .attr("transform", "rotate(-90)")
      .attr("fill", "#ffffff")
      .attr("font-size", "24px")
      .attr("font-weight", "bold")
      .style("text-anchor", "middle")
      .text("# Fires");

    // X-axis label
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 60)
      .attr("fill", "#ffffff")
      .attr("font-size", "24px")
      .attr("font-weight", "bold")
      .style("text-anchor", "middle")
      .text("Date");

    // Title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "30px")
      .attr("font-weight", "bold")
      .text("Wildfire Frequency by Cause Over Time");

    // For monthly tooltip
    const formatTooltipDate = d3.timeFormat("%b %Y");

    // The line generator (still uses count on y)
    const line = d3
      .line<{ date: Date; count: number; area: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.count))
      .curve(d3.curveMonotoneX);

    // 5) Build a legend on the left side
    const legend = svg.append("g").attr("transform", `translate(-180, 0)`);

    // Summarize total fires & total burned area for each cause
    const causeTotals: Record<string, { count: number; area: number }> = {};
    Object.entries(groupedByCause).forEach(([cause, data]) => {
      const totalCount = d3.sum(data, (d) => d.count);
      const totalArea = d3.sum(data, (d) => d.area);
      causeTotals[cause] = { count: totalCount, area: totalArea };
    });

    // The legend items
    const legendItems = Object.keys(groupedByCause).filter(
      (cause) => cause === "Total" || currentSelectedCauses.includes(cause)
    );

    // Legend background
    legend
      .append("rect")
      .attr("x", -10)
      .attr("y", -10)
      .attr("width", 160)
      .attr("height", legendItems.length * 25 + 20)
      .attr("fill", "rgba(30, 30, 30, 0.0)")
      .attr("rx", 5)
      .attr("ry", 5);

    legendItems.forEach((cause, i) => {
      const group = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 25})`)
        .attr("class", "legend-item")
        .style("cursor", "pointer")
        .on("mouseenter", function () {
          // Dim all lines, highlight only this line
          svg.selectAll(".line").attr("opacity", 0.2);
          svg
            .select(`#line-${cause.replace(/\s+/g, "-")}`)
            .attr("opacity", 1)
            .attr("stroke-width", cause === "Total" ? 8 : 5);

          // Show tooltip with fires & acres
          const tooltip = d3.select("#chart-tooltip");
          tooltip.style("visibility", "visible").html(`
                <strong>${cause}</strong><br/>
                Total Fires: ${causeTotals[cause].count.toLocaleString()}<br/>
                Total Acres: ${Math.round(causeTotals[cause].area).toLocaleString()}
              `);

          // Position near the legend item
          const legendItem = (
            d3.select(this).node() as Element
          ).getBoundingClientRect();
          tooltip
            .style("left", `${legendItem.right + 10}px`)
            .style("top", `${window.scrollY + legendItem.top}px`);
        })
        .on("mouseleave", function () {
          // Reset lines
          svg
            .selectAll(".line")
            .attr("opacity", 0.85)
            .attr("stroke-width", (d: any, i, nodes: any) => {
              const causeName = d3.select(nodes[i]).attr("data-cause");
              return causeName === "Total" ? 6 : 3;
            });
          d3.select("#chart-tooltip").style("visibility", "hidden");
        });

      // Color swatch
      group
        .append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(cause));

      // For non-Total, add dash pattern
      if (cause !== "Total") {
        group
          .append("line")
          .attr("x1", 0)
          .attr("y1", 7.5)
          .attr("x2", 15)
          .attr("y2", 7.5)
          .attr("stroke", "white")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", dashPatterns[cause]);
      }

      // Label
      group
        .append("text")
        .attr("x", 20)
        .attr("y", 12)
        .attr("fill", "#fff")
        .text(cause)
        .attr("font-size", "13px")
        .attr("font-family", "Inter, sans-serif");
    });

    // 6) Draw lines, tooltips, hover logic
    // We'll store the currently found point in `closestPoint`
    let closestPoint: { date: Date; count: number; area: number } | null = null;

    Object.entries(groupedByCause)
      .filter(
        ([cause]) => cause === "Total" || currentSelectedCauses.includes(cause)
      )
      .forEach(([cause, data]) => {
        // Container for the hovered dot
        const dots = svg
          .append("g")
          .attr("class", `dots-${cause.replace(/\s+/g, "-")}`)
          .style("display", "none");

        // The line path
        const path = svg
          .append("path")
          .datum(data)
          .attr("class", "line")
          .attr("id", `line-${cause.replace(/\s+/g, "-")}`)
          .attr("fill", "none")
          .attr("stroke", color(cause))
          .attr("stroke-width", cause === "Total" ? 6 : 3)
          .attr("opacity", 0.85)
          .attr("data-cause", cause)
          .attr("stroke-dasharray", dashPatterns[cause])
          .attr("d", line);

        // A wider invisible path for easier hovering
        svg
          .append("path")
          .datum(data)
          .attr("class", "hover-path")
          .attr("fill", "none")
          .attr("stroke", "transparent")
          .attr("stroke-width", 15)
          .attr("opacity", 0)
          .attr("d", line)
          .style("pointer-events", "stroke")
          .on("mouseenter", function () {
            // Highlight this line
            path
              .attr("stroke-width", cause === "Total" ? 8 : 5)
              .attr("opacity", 1);
            // Dim others
            svg
              .selectAll(".line")
              .filter(function () {
                return this.id !== `line-${cause.replace(/\s+/g, "-")}`;
              })
              .attr("opacity", 0.2);
            dots.style("display", "block");
          })
          .on("mouseleave", function () {
            // Reset
            path
              .attr("stroke-width", cause === "Total" ? 6 : 3)
              .attr("opacity", 0.85);
            svg.selectAll(".line").attr("opacity", 0.85);
            dots.style("display", "none");
            d3.select("#chart-tooltip").style("visibility", "hidden");
          })
          .on("click", function () {
            // Clicking sets the selectedMonthYear
            if (!closestPoint) return;
            selectedMonthYear.update((current) =>
              current?.getTime() === closestPoint.date.getTime()
                ? null
                : closestPoint.date
            );
          })
          .on("mousemove", function (event) {
            const mouseX = d3.pointer(event)[0];
            const date = x.invert(mouseX);
            const bisect = d3.bisector((d) => d.date).left;
            const index = bisect(data, date);

            if (index > 0 && index < data.length) {
              const d0 = data[index - 1];
              const d1 = data[index];
              closestPoint = date - d0.date > d1.date - date ? d1 : d0;
            } else if (index === 0) {
              closestPoint = data[0];
            } else {
              closestPoint = data[data.length - 1];
            }

            if (closestPoint && closestPoint.count > 0) {
              dots.selectAll("*").remove();
              dots
                .append("circle")
                .attr("cx", x(closestPoint.date))
                .attr("cy", y(closestPoint.count))
                .attr("r", 6)
                .attr("fill", color(cause))
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 2);

              // 🆕 Show fires + acres burned
              d3
                .select("#chart-tooltip")
                .style("visibility", "visible")
                // Increase offset so that tooltip is below the mouse,
                // helping avoid covering the legend.
                .style("left", `${event.pageX + 25}px`)
                .style("top", `${event.pageY + 25}px`).html(`
                    <strong>${cause}</strong><br/>
                    <strong>Date:</strong> ${formatTooltipDate(closestPoint.date)}<br/>
                    <strong>Fires:</strong> ${closestPoint.count.toLocaleString()}<br/>
                    <strong>Acres:</strong> ${Math.round(closestPoint.area).toLocaleString()}
                  `);
            } else {
              // Hide if no data
              d3.select("#chart-tooltip").style("visibility", "hidden");
              dots.selectAll("*").remove();
            }
          });
      });

    // 7) If selectedMY is set, highlight the dot on the 'Total' line
    // Inside your draw() function, find the section where you handle selectedMY
    // (near the end of the function around line 750-760)
    // Replace that section with this code:

    // 7) If selectedMY is set, highlight the dot on the 'Total' line
    // Inside your draw() function, find the section where you handle selectedMY
    // Replace that section with this code:

    // 7) If selectedMY is set, highlight the dot on the 'Total' line
    // Inside your draw() function, find the section where you handle selectedMY
    // Replace that section with this code:

    // 7) If selectedMY is set, highlight the dot on the 'Total' line
    if (selectedMY) {
      // Create a separate group for the selection highlight to manage z-index
      const selectionGroup = svg
        .append("g")
        .attr("class", "selection-highlight")
        .attr("pointer-events", "none"); // Make sure it doesn't interfere with interactions

      Object.entries(groupedByCause)
        .filter(([cause]) => cause === "Total") // only 'Total'
        .forEach(([cause, data]) => {
          const point = data.find(
            (d) =>
              d.date.getFullYear() === selectedMY.getFullYear() &&
              d.date.getMonth() === selectedMY.getMonth()
          );
          console.log("Selected date:", selectedMY, "Matched point:", point);

          if (!point || point.count === 0) return;

          // A large red dot with glow
          selectionGroup
            .append("circle")
            .attr("cx", x(point.date))
            .attr("cy", y(point.count))
            .attr("r", 10)
            .attr("fill", "#ff0000")
            .attr("stroke", "#fff")
            .attr("stroke-width", 3)
            .attr("filter", "url(#glow)");

          // Calculate proportions for each cause for this date
          let causeProportions = {};
          let totalFiresForThisDate = point.count;

          // For each cause, find the point for this date and calculate proportion
          Object.entries(groupedByCause)
            .filter(
              ([causeName]) =>
                causeName !== "Total" &&
                currentSelectedCauses.includes(causeName)
            )
            .forEach(([causeName, causeData]) => {
              const causePoint = causeData.find(
                (d) =>
                  d.date.getFullYear() === selectedMY.getFullYear() &&
                  d.date.getMonth() === selectedMY.getMonth()
              );

              if (causePoint && causePoint.count > 0) {
                const proportion =
                  (causePoint.count / totalFiresForThisDate) * 100;
                causeProportions[causeName] = {
                  count: causePoint.count,
                  proportion: proportion,
                };
              }
            });

          // Position the tooltip to the left side instead of right side of the point
          // This ensures it stays within the vertical axis
          const tooltipX = -205; // Fixed position on the left side
          const tooltipY = 10; // Small offset from top

          // Build tooltip HTML content
          let tooltipHtml = `
        <strong>${cause}</strong><br/>
        <strong>Date:</strong> ${formatTooltipDate(point.date)}<br/>
        <strong>Fires:</strong> ${point.count.toLocaleString()}<br/>
        <strong>Acres:</strong> ${Math.round(point.area).toLocaleString()}<br/>
        <strong>Causes:</strong>
      `;

          // Add each cause's proportion
          Object.entries(causeProportions)
            .sort((a, b) => b[1].proportion - a[1].proportion) // Sort by proportion descending
            .forEach(([causeName, data]) => {
              tooltipHtml += `<br/><span style="color:${color(causeName)}">■</span> ${causeName}: ${data.count} (${data.proportion.toFixed(1)}%)`;
            });

          // Create tooltip with fixed position on the left
          selectionGroup
            .append("foreignObject")
            .attr("x", tooltipX)
            .attr("y", tooltipY)
            .attr("width", 180) // Narrower width
            .attr("height", 100 + Object.keys(causeProportions).length * 20) // Adjust height based on number of causes
            .append("xhtml:div")
            .attr("class", "tooltip")
            .style("background", "rgba(30, 30, 30, 0.95)")
            .style("padding", "8px 12px")
            .style("border-radius", "6px")
            .style("font-size", "8px")
            .style("color", "#fff")
            .style("font-family", "Inter, sans-serif")
            .style("pointer-events", "none")
            .style("z-index", "50") // Ensure tooltip is on top
            .style("max-width", "65px") // Ensure it doesn't exceed container width
            .style("overflow-wrap", "break-word") // Allow text to wrap
            .html(tooltipHtml);
        });
    }
  }
</script>

<!-- Container for the chart -->
<div bind:this={container} class="chart-container"></div>

<style>
  .chart-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;
  }

  :global(.tooltip) {
    position: absolute;
    padding: 8px;
    background: rgba(30, 30, 30, 0.2);
    color: white;
    border-radius: 4px;
    pointer-events: none;
    font-size: 12px;
    border: 1px solid #666;
    z-index: 1000;
  }

  :global(.hover-path) {
    cursor: pointer;
  }
</style>
