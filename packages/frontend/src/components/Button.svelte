<script type='ts'>

  export let icon: string = ''
  export let large: boolean = false
  export let alt: string = ''
</script>

<button title={alt} on:click class:large class:iconOnly={icon}>
  {#if icon}
    <img src='icons/{icon}.png' alt='{icon}'>
  {/if}
  <slot></slot>
</button>

<style>
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1em;
    min-height: 1em;
    margin: 0;
  }
  button.iconOnly {
    padding: 0.25em;
    background: none;
  }
  button.large img {
    height: 5em;
  }
  img {
    object-fit: contain;
    max-width: 100%;
    max-height: 100%;
    height: 2em;
  }
</style>