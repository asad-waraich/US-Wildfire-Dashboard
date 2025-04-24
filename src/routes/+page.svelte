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
        <h1 class="page-title">US Wildfire Visualization</h1>
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
    height: 100vh;
    width: 100%;
  }
  .page-header {
    background-color: #1e1e1e;
    color: #fff;
    padding: 0.5rem 1rem;
    min-height: auto;
  }
  .header-content {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: auto;
    max-width: 100%;
    margin: 0 auto;
  }
  .filter-container {
    width: auto;
    min-width: auto;
  }
  .header-center {
    text-align: center;
    padding: auto;
    min-width: 800px; /* Added to ensure enough width for the description */
  }
  .page-title {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: 1.2rem;
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
    font-size: 0.9rem;
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
