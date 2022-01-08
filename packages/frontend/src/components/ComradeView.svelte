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
    <video class='primary' use:srcObject={primaryStream.stream} autoplay playsinline volume={comrade.volume/100} muted={comrade.volume==0}>
      <track kind='captions'>
    </video>
    {#if secondaryStream}
      <video class='secondary' use:srcObject={secondaryStream.stream} autoplay playsinline volume={comrade.volume/100} muted={comrade.volume==0}>
        <track kind='captions'>
      </video>
    {/if}
    <aside class='controls'>
      <input type='range' orient='vertical' bind:value={comrade.volume} min=0 max=100 step=1/>
      <input type='number' bind:value={comrade.volume} min=0 max=100 step=1/>
    </aside>
  </div>
{/if}

<style>
  div {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
  .controls {
    position: absolute;
    right: 1em;
    top: 50%;
    margin-top: -25%;
    opacity: 0;
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
  }
  div:hover .controls {
    opacity: 1;
  }
  aside input[type=range] {
    writing-mode: bt-lr;
    -webkit-appearance: slider-vertical;
  }
  aside input[type=number] {
    width: 5em;
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