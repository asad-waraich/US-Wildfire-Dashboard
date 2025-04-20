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
    height: 100vh; /* Takes up the full viewport */
    width: 100vw;
  }
</style>
