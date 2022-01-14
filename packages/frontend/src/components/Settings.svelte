<script lang='ts'>
  import { settingsStore } from '../stores/settings'
</script>

<main>
  <section class='group'>
    <label>
      <span>Sound Effects</span>
      <input type='checkbox' bind:checked={$settingsStore.soundEffectsEnabled}>
    </label>
    <label>
      <span>Sound Volume</span>
      <input type='number' min=0 max=200 bind:value={$settingsStore.soundEffectsVolume}>
    </label>
  </section>
</main>

<style>
  main {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    overflow: auto;
    background: #000;
    padding: 1em;
  }
  section.group {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
</style>