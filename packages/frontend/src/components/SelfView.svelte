<script type='ts'>
  import { mediaStore } from '../stores/media'

  function srcObject(node: HTMLVideoElement, stream: MediaStream) {
    node.srcObject = stream
    return {
      update(nextStream: MediaStream) {
        if (node.srcObject !== nextStream) {
          node.srcObject = nextStream
        }
      },
    }
  }
</script>

<main>
  <section class='primary'>
    {#if $mediaStore.length > 0 && $mediaStore[0].stream}
      <video use:srcObject={$mediaStore[0].stream} autoplay muted>
        <track kind='captions'>
      </video>
    {/if}
  </section>
  <section class='secondaries'>
    {#each $mediaStore as media, mediaIndex}
      {#if mediaIndex >= 1}
        <video use:srcObject={media.stream} autoplay muted>
          <track kind='captions'>
        </video>
      {/if}
    {/each}
  </section>
</main>

<style>
  main {
    display: grid;
    grid-template-columns: minmax(60%, 1fr) auto;
  }
  section.primary {
    width: 100%;
    max-height: 25vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  section.secondaries {
    width: 100%;
  }
  video {
    object-fit: contain;
    max-width: 100%;
    max-height: 100%;
  }
</style>