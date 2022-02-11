<script type='ts'>
  import Icon from "./Icon.svelte"

  export let icon: string = ''
  export let large: boolean = false
  export let alt: string = ''
</script>

<button title={alt} on:click class:large class:iconOnly={icon}>
  {#if icon}
    <Icon large={large} alt={alt} icon={icon}></Icon>
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
</style>