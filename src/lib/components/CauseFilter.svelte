<script lang="ts">
  import { selectedCauses } from "$lib/stores/fireFilters";
  import { writable } from "svelte/store";
  import { onMount } from "svelte";
  import wildfireCSV from "$lib/data/wildfire_clean.csv?url";

  let allCauses: string[] = [];
  const open = writable(false);

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

<div class="cause-select-wrapper">
  <button class="cause-button" on:click={() => open.update((o) => !o)}>
    <span>Select Causes</span>
    <svg class="caret" width="10" height="6" viewBox="0 0 10 6"
      ><path d="M0 0l5 6 5-6z" fill="#ff7a00" /></svg
    >
  </button>

  {#if $open}
    <div class="dropdown-overlay">
      <div class="dropdown-content">
        {#each allCauses as cause}
          <label class="dropdown-option">
            <input
              type="checkbox"
              class="custom-checkbox"
              checked={$selectedCauses.includes(cause)}
              on:change={() => toggle(cause)}
            />
            {cause}
          </label>
        {/each}

        <hr class="divider" />

        <label class="dropdown-option">
          <input
            type="checkbox"
            class="custom-checkbox"
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
    </div>
  {/if}
</div>

<style>
  .cause-select-wrapper {
    position: relative;
    z-index: 10;
  }

  .cause-button {
    background: #1c1c1c;
    border: 1px solid #666;
    color: white;
    padding: auto;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .cause-button .caret {
    margin-left: 0.25rem;
  }

  .dropdown-overlay {
    position: absolute;
    top: 120%;
    left: 0;
    background: rgba(30, 30, 30, 0.7);
    border: 1px solid #555;
    padding: 0.75rem;
    border-radius: 8px;
    width: 240px;
    max-height: 300px;
    overflow-y: auto;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  }

  .dropdown-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .dropdown-option {
    font-size: 0.85rem;
    color: #ddd;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0.25rem;
    border-radius: 4px;
  }

  .custom-checkbox {
    accent-color: #ff7a00;
  }

  .divider {
    border: none;
    border-top: 1px solid #444;
    margin: 0.5rem 0;
  }
</style>
