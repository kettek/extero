<main>
  <section>
    <slot></slot>
  </section>
</main>

<style>
  main {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: grid;
    justify-content: center;
    align-content: center;
    z-index: 100;
  }
  section {
    min-width: 50%;
    min-height: 50%;
  }
</style>