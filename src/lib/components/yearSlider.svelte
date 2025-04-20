<script lang="ts">
    import { yearRange } from '$lib/stores/fireFilters';
    let min = 2004;
    let max = 2015;
  
    let start = min;
    let end = max;
  
    $: yearRange.set([start, end]);
  </script>
  
  <div style="margin-bottom: 1rem;">
    <label>📅 Year Range: {$yearRange[0]} - {$yearRange[1]}</label>
    <div style="display: flex; gap: 1rem; align-items: center;">
      <input type="range" bind:value={start} min={min} max={end} />
      <input type="range" bind:value={end} min={start} max={max} />
    </div>
  </div>
  