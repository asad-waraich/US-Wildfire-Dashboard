<script>
  import "../app.css";
</script>

<div class="app-container">
  <slot />
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;

    /* ✅ NEW: Prevent horizontal scroll & zoom issues */
    max-width: 100%;
    overflow-x: hidden;
    transform: scale(1);
    transform-origin: top center;
  }

  /* Optional: Reset body margin in case it’s adding whitespace */
  :global(body) {
    margin: 0;
  }
</style>
