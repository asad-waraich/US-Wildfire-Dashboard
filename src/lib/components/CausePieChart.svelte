<script lang="ts">
    import { onMount } from 'svelte';
    import { yearRange, selectedCauses } from '$lib/stores/fireFilters';
    import * as d3 from 'd3';
  
    export let wildfireData = [];
    let container: HTMLDivElement;
  
    let currentYearRange = [2000, 2020];
    let currentSelectedCauses: string[] = [];
  
    const color = d3.scaleOrdinal<string>()
      .range([
        "#ff7800", "#ff0000", "#4daf4a", "#377eb8", "#984ea3",
        "#ff9f00", "#e41a1c", "#a65628", "#f781bf", "#999999"
      ]);
  
    let tooltip;
  
    function draw() {
      if (!container) return;
  
      d3.select(container).selectAll('*').remove();
  
      const width = container.clientWidth;
      const height = 300;
      const radius = Math.min(width, height) / 2 - 30;
  
      const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
  
      if (!tooltip) {
        tooltip = d3.select("body")
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
          .style("border", "1px solid #555")
          .style("white-space", "nowrap");
      }
  
      const [start, end] = currentYearRange;
      const filtered = wildfireData.filter(
        d => d.year >= start && d.year <= end && currentSelectedCauses.includes(d.cause)
      );
  
      const causeCounts = d3.rollups(filtered, v => v.length, d => d.cause)
        .map(([cause, count]) => ({ cause, count }))
        .sort((a, b) => d3.descending(a.count, b.count));
  
      if (causeCounts.length === 0) {
        svg.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", ".35em")
          .attr("fill", "#aaa")
          .style("font-size", "14px")
          .text("No data for selected causes & range.");
        return;
      }
  
      const total = d3.sum(causeCounts, d => d.count);
      color.domain(causeCounts.map(d => d.cause));
  
      const pie = d3.pie<{ cause: string; count: number }>()
        .value(d => d.count)
        .sort(null);
  
      const arc = d3.arc<any>()
        .innerRadius(0)
        .outerRadius(radius);
  
      const arcs = svg.selectAll("path")
        .data(pie(causeCounts))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.cause))
        .attr("stroke", "#111")
        .attr("stroke-width", 1)
        .on("mouseover", function (event, d) {
          tooltip.style("visibility", "visible")
            .html(`
              <strong>${d.data.cause}</strong><br/>
              ${((d.data.count / total) * 100).toFixed(1)}%<br/>
              ${d.data.count.toLocaleString()} fires
            `);
          d3.select(this).transition().duration(200).attr("transform", "scale(1.05)");
        })
        .on("mousemove", event => {
          tooltip
            .style("left", `${event.pageX + 15}px`)
            .style("top", `${event.pageY}px`);
        })
        .on("mouseout", function () {
          tooltip.style("visibility", "hidden");
          d3.select(this).transition().duration(200).attr("transform", "scale(1)");
        });
  
      // Add center title
      svg.append("text")
        .attr("text-anchor", "middle")
        .attr("y", radius + 30)
        .attr("fill", "#fff")
        .style("font-size", "16px")
        .text("Cause Proportions");
    }
  
    onMount(() => {
      draw();
      window.addEventListener("resize", draw);
      const unsub1 = yearRange.subscribe(val => { currentYearRange = val; draw(); });
      const unsub2 = selectedCauses.subscribe(val => { currentSelectedCauses = val; draw(); });
      return () => {
        unsub1();
        unsub2();
        window.removeEventListener("resize", draw);
      };
    });
  </script>
  
  <div bind:this={container} class="chart-container"></div>
  
  <style>
    .chart-container {
      width: 50%;
      height: 300px;
      padding-top: 20px;
      margin-bottom: 20px;
      display: inline-block;
      vertical-align: top;
      box-sizing: border-box;
    }
  </style>
  