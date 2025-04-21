<script lang="ts">
  import Map from "$lib/components/Map.svelte";
  import YearSlider from "$lib/components/yearSlider.svelte";
  import CauseFilter from "$lib/components/CauseFilter.svelte";
</script>

<div class="page-container">
  <header class="page-header">
    <div class="header-content">
      <div class="filter-container">
        <CauseFilter />
      </div>
      <div class="header-center">
        <h1 class="page-title">🔥US Wildfire Visualization🔥</h1>
        <p class="page-description">
          Explore wildfire patterns across the US. Adjust the year range and
          filter by cause
        </p>
      </div>
      <div class="filter-container">
        <YearSlider />
      </div>
    </div>
  </header>
  <main class="map-wrapper">
    <Map />
  </main>
</div>

<style>
  .page-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }
  .page-header {
    background-color: #1e1e1e;
    color: #fff;
    padding: var(--spacing-md) var(--spacing-md);
    min-height: 7rem;
  }
  .header-content {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-xl);
    max-width: 2000px;
    margin: 0 auto;
  }
  .filter-container {
    min-width: 200px;
  }
  .header-center {
    text-align: center;
    padding: 0 var(--spacing-md);
    min-width: 800px; /* Added to ensure enough width for the description */
  }
  .page-title {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: 2.5rem;
    font-weight: bold;
    /* sweep from left to right around the center */
    background: radial-gradient(
      circle,
      #feb24c 0%,
      #feb24c 10%,
      /* sudden plateau */ #ff7a00 40%,
      #ff0000 100%
    );

    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .page-description {
    margin-top: var(--spacing-xs);
    font-size: 1.5rem;
    color: #ffffff;
    font-weight: bold;
    /* white-space: nowrap; */
  }
  .map-wrapper {
    flex: 1;
    height: 100%;
    max-width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
</style>
