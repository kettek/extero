<script type='ts'>
  export let icon: string = ''
  export let alt: string = ''
  export let large: boolean = false
</script>

<img src='icons/{icon}.png' alt='{icon||alt}' class:large>

<style>
  img {
    object-fit: contain;
    max-width: 100%;
    max-height: 100%;
    height: 2em;
  }
  img.large {
    height: 5em;
  }
</style>