<script type='ts'>
  import type { Actions } from '../shared/emitters/actions'

  import { mediaStore } from '../stores/media'
  import Button from './Button.svelte'

  export let muteAudio: boolean
  export let muteVideo: boolean
  export let actions: Actions

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
      <video use:srcObject={$mediaStore[0].stream} autoplay playsinline muted>
        <track kind='captions'>
      </video>
      <nav>
        <Button on:click={()=>actions.trigger('mute audio')} icon={muteAudio?'micOff':'micOn'} alt='Mute Audio'/>
        <Button on:click={()=>actions.trigger('mute video')} icon={muteVideo?'videoOff':'videoOn'} alt='Mute Video'/>
      </nav>
    {/if}
  </section>
  <section class='secondaries'>
    {#each $mediaStore as media, mediaIndex}
      {#if mediaIndex >= 1}
        <video use:srcObject={media.stream} autoplay playsinline muted>
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
  section {
    position: relative;
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
  nav {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    bottom: 0;
  }
</style>