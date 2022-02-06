<script type='ts'>
  import { uniqueNamesGenerator, colors, starWars } from 'unique-names-generator'
  import { localStore, Store, storeAvailable } from '../stores/localStore'
  import type { UserI } from '../types/user'
  import Button from './Button.svelte'

  export let storage: Store<UserI> = localStore<UserI>('user', {
    name: '',
    color: '',
    image: '',
  })
  export let nameReady: boolean = false

  let error: string = ''
  let maxImageSize: number = 1024 * 1024 * 2

  if ($storage.name === '') {
    randomizeName()
  }

  function randomizeName() {
    $storage.name = uniqueNamesGenerator({
      dictionaries: [colors, starWars],
      separator: ' ',
      style: 'capital',
    })
  }

  async function imageFromFile(file: File) {
    if (!file.type.startsWith('image/')) {
      error = 'file must be an image'
    }
    let buffer = await file.arrayBuffer()

    if (buffer.byteLength > maxImageSize) {
      error = `image must be less than ${maxImageSize/1024/1024}MB`
      return
    }
    let blob = new Blob([buffer])
    let reader = new FileReader()
    reader.onload = (e: Event) => {
      let base64 = reader.result as string
      $storage.image = ("data:"+file.type+";base64,")+base64.substring("data:application/octet-stream;base64,".length)
    }
    reader.readAsDataURL(blob)
  }
  async function imageLoad() {
    let el = document.createElement('input')
    el.type = 'file'
    el.onchange = async (e: InputEvent) => {
      for (let file of el.files) {
        imageFromFile(file)
        return
      }
    }
    el.click()
  }
  async function imageDrop(e: DragEvent) {
    e.preventDefault()

    if (e.dataTransfer.items) {
      for (let item of e.dataTransfer.items) {
        if (item.kind === 'file') {
          let file = item.getAsFile()
          imageFromFile(file)
        }
      }
    }
  }
  function imageDragOver(e: DragEvent) {
    e.preventDefault()
  }
</script>

<main>
  <section>
    <label>
      <span>Name</span>
      <input type='text' bind:value={$storage.name}/>
      <Button on:click={randomizeName} icon='random' alt='randomize name' />
    </label>
    <label>
      <span>Color</span>
      <input type='color' bind:value={$storage.color}/>
    </label>
    <div on:click={imageLoad} on:drop={imageDrop} on:dragover={imageDragOver}>
      <span>Image</span>
      <img src={$storage.image} alt="user"/>
    </div>
    <article>
      {#if error}
      <span>{error}</span>
      {/if}
    </article>
  </section>
  <nav>
    <Button on:click={()=>nameReady=true} icon='okay'/>
  </nav>
</main>

<style>
  section {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
  }
  label {
    display: flex;
    align-items: center;
  }
  label span {
    min-width: 4em;
  }
  div span {
    min-width: 4em;
  }
  div img {
    max-width: 8em;
    max-height: 8em;
    object-fit: contain
  }
  nav {
    display: flex;
    justify-content: flex-end;
  }
</style>