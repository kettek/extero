<script type='ts'>
  import type { Comrade } from "../comrade"

  export let comrade: Comrade

  $: cameraStream = comrade.inboundMedias.find(v=>v.mediaType==='camera')
  $: captureStream = comrade.inboundMedias.find(v=>v.mediaType==='capture')
  $: primaryStream = captureStream || cameraStream
  $: secondaryStream = (captureStream && cameraStream) ? cameraStream : undefined

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

{#if primaryStream}
  <div>
    <video class='primary' use:srcObject={primaryStream.stream} autoplay playsinline>
      <track kind='captions'>
    </video>
    {#if secondaryStream}
      <video class='secondary' use:srcObject={secondaryStream.stream} autoplay playsinline>
        <track kind='captions'>
      </video>
    {/if}
  </div>
{/if}

<style>
  div {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
  video {
    object-fit: contain;
    width: 100%;
    height: 100%;
  }
  video.secondary {
    position: absolute;
    top: 1em;
    right: 1em;
    width: 20%;
    height: 20%;
    object-fit: contain;
  }
</style>