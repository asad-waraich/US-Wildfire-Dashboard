<script lang="ts">
  import { yearRange } from "$lib/stores/fireFilters";

  let min = 2004;
  let max = 2015;
  let start = min;
  let end = max;
  let singleYearMode = false;



  // Number of ticks at start, middle, end
  const tickCount = 3;

  // Generate tick positions and labels
  $: ticks = Array.from({ length: tickCount }, (_, i) => {
    const pct = i / (tickCount - 1);
    const year = Math.round(min + (max - min) * pct);
    return { pos: pct * 100, year };
  });

  // Update the shared store whenever start or end changes
  $: yearRange.set(singleYearMode ? [start, start] : [start, end]);

  $:if (singleYearMode) {
  end = start;
}
</script>



<div class="year-slider-container">
  <!-- Title above the track -->
  <div class="range-values">
    <span class="year-range-label">Year Range</span>
    <label class="single-year-toggle">
      <input type="checkbox" bind:checked={singleYearMode}>
      <span>Single Year</span>
    </label>
  </div>

  <div class="slider-track-container">
    <div class="slider-track"></div>
    <div
      class="slider-track-highlight"
      class:single-mode={singleYearMode}
      style="left: {((start - min) / (max - min)) * 100}%; right: {100 -
        ((end - min) / (max - min)) * 100}%"
    ></div>

    <!-- Ticks and labels -->
    <div class="slider-ticks">
      {#each ticks as { pos, year }}
        <div class="tick" style="left: {pos}%">
          <span class="tick-label">{year}</span>
        </div>
      {/each}
    </div>

    <!-- Range inputs for handles -->
    <input
      type="range"
      class="range-input start-range"
      bind:value={start}
      {min}
      max={singleYearMode ? max : end}
      step="1"
    />
    <input
      type="range"
      class="range-input end-range"
      bind:value={end}
      min={start}
      {max}
      step="1"
      disabled={singleYearMode}
    />
  </div>
</div>

<style>
  .year-slider-container {
    width: 100%;
    max-width: 280px;
    margin: 0 auto;
    padding: auto;
    user-select: none;
  }

  .range-values {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: -1.5rem;
  }

  .year-range-label {
    color: #fff;
    font-size: 0.8rem;
    font-weight: 700;
  }

  .slider-track-container {
    position: relative;
    height: 4rem;
  }

  /* Base track */
  .slider-track {
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: #444;
    border-radius: 2px;
    transform: translateY(-50%);
  }

  /* Highlight between thumbs */
  .slider-track-highlight {
    position: absolute;
    top: 50%;
    height: 4px;
    background-color: #ff7a00;
    border-radius: 2px;
    transform: translateY(-50%);
  }

  /* Tick marks and labels */
  .slider-ticks {
    position: absolute;
    top: calc(50% + 8px);
    left: 0;
    width: 100%;
    pointer-events: none;
    height: auto;
  }
  .tick {
    position: absolute;
    transform: translateX(-50%);
  }

  .tick::before {
    content: "";
    display: block;
    width: 1px;
    height: 8px;
    background-color: #666;
    margin-bottom: 2px;
  }

  .tick-label {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.6rem;
    color: #aaa;
    white-space: nowrap;
    font-weight: 700;
  }

  /* Input styles */
  .range-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    -webkit-appearance: none;
    appearance: none;
    pointer-events: none;
  }
  .range-input:focus {
    outline: none;
  }

  /* Thumbs */
  .range-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(90deg, #feb24c, #ff4500);
    border: 3px solid #222;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
    cursor: pointer;
    pointer-events: all;
    margin-top: -9px;
  }
  .range-input::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(90deg, #feb24c, #ff4500);
    border: 3px solid #222;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
    cursor: pointer;
    pointer-events: all;
  }

  /* Hide native track */
  .range-input::-webkit-slider-runnable-track {
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
  }
  .range-input::-moz-range-track {
    height: 4px;
    background: transparent;
  }
  .single-year-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  color: #aaa;
  cursor: pointer;
  padding: 4px;
  z-index: 10;
  position: relative;
}

.single-year-toggle input {
  cursor: pointer;
  width: 12px;
  height: 12px;
}

/* Add this to style the disabled thumb when in single year mode */
.range-input:disabled::-webkit-slider-thumb {
  opacity: 0.5;
  cursor: not-allowed;
}

.range-input:disabled::-moz-range-thumb {
  opacity: 0.5;
  cursor: not-allowed;
}
.slider-track-highlight.single-mode {
  background-color: #ff5500; /* Brighter color for single year */
  height: 6px; /* Slightly thicker */
}

.start-range {
  z-index: 3; /* Lower z-index for start range */
}

.end-range {
  z-index: 2; /* Even lower for the end range when in single year mode */
}
.single-year-mode .start-range {
  z-index: 4; /* Higher z-index to ensure it's clickable */
}

</style>
