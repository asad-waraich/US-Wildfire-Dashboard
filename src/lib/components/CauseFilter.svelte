<script lang="ts">
  import { selectedCauses } from "$lib/stores/fireFilters";
  import { writable } from "svelte/store";
  import { onMount } from "svelte";
  import wildfireCSV from "$lib/data/wildfire_clean.csv?url"; // ✅ This line is key


  let allCauses: string[] = [];
  const open = writable(false);

  // Fetch from cleaned CSV only once
  onMount(async () => {
    const res = await fetch(wildfireCSV);
    const text = await res.text();
    const rows = text.split("\n");
    const headers = rows[0].split(",");
    const causeIndex = headers.indexOf("STAT_CAUSE_DESCR");

    const causes = new Set<string>();
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(",");
      if (cols[causeIndex]) {
        causes.add(cols[causeIndex].trim());
      }
    }
    allCauses = Array.from(causes).sort();
  });

  function toggle(cause: string) {
    selectedCauses.update((current) =>
      current.includes(cause)
        ? current.filter((c) => c !== cause)
        : [...current, cause]
    );
  }
</script>

<div>
  <button on:click={() => open.update((o) => !o)}> 🧯 Select Causes </button>

  {#if $open}
  <div class="dropdown">
    {#each allCauses as cause}
      <label>
        <input
          type="checkbox"
          checked={$selectedCauses.includes(cause)}
          on:change={() => toggle(cause)}
        />
        {cause}
      </label><br>
    {/each}
  
    <hr />
  
    <!-- Add 'All Causes' at the end -->
    <label>
      <input
        type="checkbox"
        checked={$selectedCauses.length === allCauses.length}
        on:change={() => {
          if ($selectedCauses.length === allCauses.length) {
            selectedCauses.set([]);
          } else {
            selectedCauses.set(allCauses);
          }
        }}
      />
      <strong>All Causes</strong>
    </label>
  </div>
  
  {/if}
</div>

<style>
  .dropdown {
    border: 1px solid #ccc;
    padding: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
    background: white;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  }
</style>
