<script lang='ts'>
  import { onMount } from 'svelte'

	import { v4 } from 'uuid'
  import { mediaStore } from '../stores/media'

  export let ready: boolean = false
  export let pending: string = ''
  export let error: string = ''

  let devices: MediaDeviceInfo[] = []
  $: audioDevices = devices.filter(v=>v.kind==='audioinput')
  $: videoDevices = devices.filter(v=>v.kind==='videoinput')

  function addMediaSource() {
    mediaStore.push({
      mediaType: 'unknown',
      uuid: v4(),
      stream: undefined,
    })
  }
  function removeMediaSource(uuid: string) {
    mediaStore.remove(uuid)
  }

  async function requestMedia(uuid: string, e: Event) {
    let target = <HTMLSelectElement>(e.target)
    let media = $mediaStore.find(v=>v.uuid===uuid)
    if (!media) return
    if (target.value === media.mediaType) return
    if (target.value === 'camera' || target.value === 'capture' || target.value === 'unknown') {
      media.mediaType = target.value
      await refreshMedia(media.uuid)
    }
  }

  async function refreshDevices() {
    pending = 'refreshing devices'
    try {
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
    } catch (e: any) {
      console.error(e)
    }
    devices = await navigator.mediaDevices.enumerateDevices()
    pending = ''
  }

  async function refreshMedia(uuid: string) {
    let media = $mediaStore.find(v=>v.uuid===uuid)
    if (!media) return

    if (media.mediaType === 'camera') {
      // Okay, if we have one _desired_, let's open it up.
      if (media.stream) {
        media.stream.getTracks().forEach((track: MediaStreamTrack) => {
          track.stop()
        })
        media.stream = undefined
      }
      pending = 'requesting camera'
      try {
        let videoConstraints: MediaTrackConstraints = {
          width: media.width,
          height: media.height,
          frameRate: media.framerate,
        }
        let audioConstraints: MediaTrackConstraints = {
        }
        if (media.facing) {
          videoConstraints.facingMode = media.facing
        }
        if (media.videoDevice) {
          videoConstraints.deviceId = { exact: media.videoDevice }
        }
        if (media.audioDevice) {
          audioConstraints.deviceId = { exact: media.audioDevice }
        }
        if (media.noiseSuppression) {
          audioConstraints.noiseSuppression = true
        }
        media.stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        })
      } catch(err: any) {
        error = err
      }
      pending = ''
    } else if (media.mediaType === 'capture') {
      pending = 'requesting capture'
      try {
        media.stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            audio: media.captureAudio,
          },
        })
      } catch(err: any) {
        console.error(err)
        error = err
      }
      pending = ''
    }

    mediaStore.refresh()
  }

  async function requestCapture(uuid: string) {
    refreshMedia(uuid)
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

  function clearError() {
    error = ''
  }

  onMount(async () => {
    await refreshDevices()
    mediaStore.push({
      mediaType: 'camera',
      uuid: v4(),
      stream: undefined,
    })
    refreshMedia($mediaStore[0].uuid)
  })
</script>

<main>
  <header>
    Select/Add Media Sources
  </header>
  <section>
    {#each $mediaStore as media}
      <article class='media'>
        <aside>
          <select on:change={(e)=>requestMedia(media.uuid, e)} value={media.mediaType}>
            <option value='unknown'>unknown</option>
            <option value='camera'>camera</option>
            <option value='capture'>capture</option>
          </select>
          {#if media.mediaType === 'camera'}
            <aside>Select a video source</aside>
            <select bind:value={media.videoDevice} on:change={()=>refreshMedia(media.uuid)}>
              <option value=''>Default</option>
              {#each videoDevices as videoDevice}
                <option value={videoDevice.deviceId}>{videoDevice.label}</option>
              {/each}
            </select>
            <aside>
              Preferred resolution and framerate
            </aside>
            <label>
              <span>Width</span>
              <input type='number' bind:value={media.width} on:change={()=>refreshMedia(media.uuid)}>
            </label>
            <label>
              <span>Height</span>
              <input type='number' bind:value={media.height} on:change={()=>refreshMedia(media.uuid)}>
            </label>
            <label>
              <span>Framerate</span>
              <input type='number' bind:value={media.framerate} on:change={()=>refreshMedia(media.uuid)}>
            </label>
            <label>
              <span>Facing</span>
              <select bind:value={media.facing} on:change={()=>refreshMedia(media.uuid)}>
                <option value=''>Default</option>
                <option value='user'>User/Front</option>
                <option value='environment'>Environment/Back</option>
              </select>
            </label>
            <aside>Select an audio source</aside>
            <select bind:value={media.audioDevice} on:change={()=>refreshMedia(media.uuid)}>
              <option value=''>Default</option>
              {#each audioDevices as audioDevice}
                <option value={audioDevice.deviceId}>{audioDevice.label}</option>
              {/each}
            </select>
            <label>
              <span>Noise Suppression</span>
              <input type='checkbox' bind:checked={media.noiseSuppression} on:change={()=>refreshMedia(media.uuid)}>
            </label>
          {:else if media.mediaType === 'capture'}
            <button on:click={()=>requestCapture(media.uuid)}>reacquire</button>
            <label>
              <span>capture audio</span>
              <input type='checkbox' bind:checked={media.captureAudio} on:change={()=>refreshMedia(media.uuid)}/>
            </label>
          {:else}
            Select a camera or capture device.
          {/if}
          <nav>
            <button on:click={()=>removeMediaSource(media.uuid)}>remove</button>
          </nav>
        </aside>
        <aside>
          {#if media.stream}
            <video use:srcObject={media.stream} autoplay playsinline>
              <track kind='captions'>
            </video>
          {/if}
        </aside>
      </article>
    {/each}
    <nav>
      <button on:click={addMediaSource}>add media source</button>
    </nav>
  </section>
  <nav>
    <button on:click={()=>ready=true}>okay</button>
  </nav>
  {#if pending}
    <article class='pender'>
      {pending}
    </article>
  {/if}
  {#if error}
    <article class='pender error'>
      {error}
      <button on:click={clearError}>okay</button>
    </article>
  {/if}
</main>

<style>
  main {
    position: relative;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    min-width: 60ch;
    min-height: 30ch;
  }
  main > nav {
    display: flex;
    justify-content: flex-end;
  }
  section {
    display: flex;
    flex-wrap: wrap;
  }
  article {
    width: 60ch;
    height: 30ch;
    padding: .5em;
    margin: .5em;
    background: rgb(32, 32, 32);
  }
  article.media {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
  article.media video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  aside {
    display: flex;
    flex-direction: column;
  }
  .pender {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
  }
  .error {
    color: red;
  }
  input[type=number] {
    width: 5em;
  }
</style>