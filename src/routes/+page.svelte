<script lang="ts">
  import Map from "$lib/components/Map.svelte";
  import YearSlider from "$lib/components/yearSlider.svelte";
  import CauseFilter from "$lib/components/CauseFilter.svelte";
</script>

<h1>🔥 Hello Wildfire Map!</h1>

<div class="controls">
  <YearSlider />
  <CauseFilter />
</div>

<Map />

<style>
  .controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }
</style>
