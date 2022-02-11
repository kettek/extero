<script type='ts'>
  import type { Comrade } from "../comrade"
  import Icon from "./Icon.svelte"

  export let comrade: Comrade

  $: cameraStream = comrade.inboundMedias.find(v=>v.mediaType==='camera')
  $: captureStream = comrade.inboundMedias.find(v=>v.mediaType==='capture')
  $: primaryStream = captureStream || cameraStream
  $: secondaryStream = (captureStream && cameraStream) ? cameraStream : undefined

  let primaryElement: HTMLVideoElement
  let secondaryElement: HTMLVideoElement

  let primaryContext: AudioContext
  let secondaryContext: AudioContext

  let primaryGain: GainNode
  let secondaryGain: GainNode

  $: {
    if (comrade && primaryGain) {
      if (comrade.volume === 0) {
        primaryGain.gain.value = 0
      } else {
        primaryGain.gain.value = (comrade.volume-100)/100
      }
    }
  }

  $: {
    if (comrade && secondaryGain) {
      if (comrade.volume === 0) {
        secondaryGain.gain.value = 0
      } else {
        secondaryGain.gain.value = (comrade.volume-100)/100
      }
    }
  }

  $: {
    if (primaryElement) {
      if (!primaryContext) {
        primaryContext = new AudioContext()
        let audioSource = primaryContext.createMediaElementSource(primaryElement)
        primaryGain = primaryContext.createGain()
        audioSource.connect(primaryGain)
        primaryGain.connect(primaryContext.destination)
        console.log('added primary audio context')
      }
    } else if (primaryContext) {
      primaryContext.close()
      secondaryContext = undefined
    }
    if (secondaryElement) {
      if (!secondaryContext) {
        secondaryContext = new AudioContext()
        let audioSource = secondaryContext.createMediaElementSource(secondaryElement)
        secondaryGain = secondaryContext.createGain()
        audioSource.connect(secondaryGain)
        secondaryGain.connect(secondaryContext.destination)
        console.log('added secondary audio context')
      }
    } else if (secondaryContext) {
      secondaryContext.close()
      secondaryContext = undefined
    }
  }

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

  function onMousewheel(e: WheelEvent) {
    comrade.volume -= Math.sign(e.deltaY) * 5
    if (comrade.volume < 0) comrade.volume = 0
    if (comrade.volume > 200) comrade.volume = 200
  }
</script>

{#if primaryStream}
  <div on:wheel={onMousewheel}>
    <video bind:this={primaryElement} class='primary' use:srcObject={primaryStream.stream} autoplay playsinline muted={comrade.volume===0}>
      <track kind='captions'>
    </video>
    {#if secondaryStream}
      <video bind:this={secondaryElement} class='secondary' use:srcObject={secondaryStream.stream} autoplay playsinline muted={comrade.volume===0}>
        <track kind='captions'>
      </video>
    {/if}
    <aside class='controls'>
      <input type='range' orient='vertical' bind:value={comrade.volume} min=0 max=200 step=0.25/>
      <input type='number' bind:value={comrade.volume} min=0 max=200 step=0.25/>
    </aside>
    <aside class='indicator'>
      {#if comrade.volume === 0}
        <Icon icon='speakerOff' large></Icon>
      {:else if comrade.volume < 35}
        <Icon icon='speakerLow' large></Icon>
      {/if}
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
  .indicator {
    pointer-events: none;
    position: absolute;
    bottom: 0;
    width: 100%;
    text-align: center;
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