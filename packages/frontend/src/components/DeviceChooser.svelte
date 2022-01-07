<script type='ts'>
  import { createEventDispatcher, onMount } from 'svelte'

  const dispatch = createEventDispatcher()

  let devices: MediaDeviceInfo[] = []
  $: audioInputDevices = devices.filter(v=>v.kind==='audioinput')
  $: videoDevices = devices.filter(v=>v.kind==='videoinput')

  export let ready: boolean = false
  export let videoDevice: string = ''
  export let videoWidth: number
  export let videoHeight: number
  export let videoFramerate: number
  export let videoFacing: 'user' | 'environment'
  export let audioDevice: string = ''

  onMount(async () => {
    await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })
    devices = await navigator.mediaDevices.enumerateDevices()
  })

  function selectVideo(e: any) {
    dispatch('selectVideo', e.target.value)
  }
  function selectAudio(e: any) {
    dispatch('selectAudio', e.target.value)
  }
</script>

<main>
  <section>
    <aside>Select a video source</aside>
    <select bind:value={videoDevice}>
      {#each videoDevices as videoDevice}
        <option value={videoDevice.deviceId}>{videoDevice.label}</option>
      {/each}
    </select>
    <aside>
      Preferred resolution and framerate
    </aside>
    <label>
      <span>Width</span>
      <input type='number' bind:value={videoWidth}>
    </label>
    <label>
      <span>Height</span>
      <input type='number' bind:value={videoHeight}>
    </label>
    <label>
      <span>Framerate</span>
      <input type='number' bind:value={videoFramerate}>
    </label>
    <label>
      <span>Facing</span>
      <select bind:value={videoFacing}>
        <option value='user'>User/Front</option>
        <option value='environment'>Environment/Back</option>
      </select>
    </label>
  </section>
  <section>
    <aside>Select an audio source</aside>
    <select bind:value={audioDevice}>
      {#each audioInputDevices as audioDevice}
        <option value={audioDevice.deviceId}>{audioDevice.label}</option>
      {/each}
    </select>
  </section>
  <button on:click={()=>ready=true}>okay</button>
</main>
