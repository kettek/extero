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
  <section class='container'>
    {#each $mediaStore as media}
      <section class='media'>
        <aside>
          <section class='group'>
            <header>Media Type</header>
            <section class='options'>
              <select on:change={(e)=>requestMedia(media.uuid, e)} value={media.mediaType}>
                <option value='unknown'>unknown</option>
                <option value='camera'>camera</option>
                <option value='capture'>capture</option>
              </select>
            </section>
          </section>
          {#if media.mediaType === 'camera'}
            <section class='group'>
              <header>Video Source</header>
              <section class='options'>
                <select bind:value={media.videoDevice} on:change={()=>refreshMedia(media.uuid)}>
                  <option value=''>Default</option>
                  {#each videoDevices as videoDevice}
                    <option value={videoDevice.deviceId}>{videoDevice.label}</option>
                  {/each}
                </select>
              </section>
            </section>
            <section class='group'>
              <header>Video Options</header>
              <section class='options'>
                <label>
                  <span>Width</span>
                  <input type='number' bind:value={media.width} placeholder='default' on:change={()=>refreshMedia(media.uuid)}>
                </label>
                <label>
                  <span>Height</span>
                  <input type='number' bind:value={media.height} placeholder='default' on:change={()=>refreshMedia(media.uuid)}>
                </label>
                <label>
                  <span>Framerate</span>
                  <input type='number' bind:value={media.framerate} placeholder='default' on:change={()=>refreshMedia(media.uuid)}>
                </label>
                <label>
                  <span>Facing</span>
                  <select bind:value={media.facing} on:change={()=>refreshMedia(media.uuid)}>
                    <option value=''>Default</option>
                    <option value='user'>User/Front</option>
                    <option value='environment'>Environment/Back</option>
                  </select>
                </label>
              </section>
            </section>
            <section class='group'>
              <header>Audio Source</header>
              <section class='options'>
                <select bind:value={media.audioDevice} on:change={()=>refreshMedia(media.uuid)}>
                  <option value=''>Default</option>
                  {#each audioDevices as audioDevice}
                    <option value={audioDevice.deviceId}>{audioDevice.label}</option>
                  {/each}
                </select>
              </section>
            </section>
            <section class='group'>
              <header>Audio Options</header>
              <section class='options'>
                <label>
                  <span>Noise Suppression</span>
                  <input type='checkbox' bind:checked={media.noiseSuppression} on:change={()=>refreshMedia(media.uuid)}>
                </label>
              </section>
            </section>
          {:else if media.mediaType === 'capture'}
            <section class='group'>
              <header>Capture Options</header>
              <section class='options'>
                <button on:click={()=>requestCapture(media.uuid)}>reacquire</button>
                <label>
                  <span>capture audio</span>
                  <input type='checkbox' bind:checked={media.captureAudio} on:change={()=>refreshMedia(media.uuid)}/>
                </label>
              </section>
            </section>
          {:else}
            <section class='group'>
              Select a camera or capture device.
            </section>
          {/if}
          <nav>
            <button on:click={()=>removeMediaSource(media.uuid)}>remove</button>
          </nav>
        </aside>
        <aside class='preview'>
          {#if media.stream}
            <video use:srcObject={media.stream} autoplay playsinline>
              <track kind='captions'>
            </video>
          {/if}
        </aside>
      </section>
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
    grid-template-rows: minmax(0, 1fr) auto;
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
  .container {
    padding: .5em;
    margin: .5em;
  }
  .media {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    background: rgb(32, 32, 32);
    margin: .5em;
    padding: .5em;
  }
  .media video {
    width: 100%;
    height: 100%;
    max-width: 640px;
    max-height: 360px;
    object-fit: contain;
  }
  .group {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    margin-bottom: .5em;
  }
  .group header {
    font-weight: bold;
    text-transform: uppercase;
  }
  .options {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    padding: .5em;
    margin-left: .5em;
  }
  aside.preview {
    display: flex;
    align-items: center;
    justify-content: center;
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
    width: 6em;
  }
  select {
    width: 30ch;
  }
</style>