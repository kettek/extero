<script type='ts'>
  import { onMount } from "svelte"
  import { enableStore } from "../stores/localStore"
  import Button from "./Button.svelte"

  export let ready: boolean = false

  let pendingRequest: boolean = true
  let storageAllowed: boolean = false
  let persistentStorage: boolean = false
  let error: string = ''

  function storageAvailable(type: string): boolean {
    let storage: Storage = null
    try {
      storage = window[type]
      let x = '__storage_test__'
      storage.setItem(x, x)
      storage.removeItem(x)
      return true
    } catch(e) {
      return e instanceof DOMException && (
        // everything except Firefox
        e.code === 22 ||
        // Firefox
        e.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        e.name === 'QuotaExceededError' ||
        // Firefox
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
        // acknowledge QuotaExceededError only if there's something already stored
        (storage && storage.length !== 0)
    }
  }


  onMount(async () => {
    storageAllowed = storageAvailable('localStorage')
    if (storageAllowed) {
      try {
        persistentStorage = await navigator.storage.persist()
      } catch(err: any) {
        error = err
      }
    }

    console.log('got storage', storageAllowed, persistentStorage)

    enableStore(storageAllowed)

    pendingRequest = false

    // If storage has already been allowed, continue onwards.
    if (storageAllowed) {
      ready = true
    }
  })
</script>

<main>
  <section>
    {#if pendingRequest}
      Requesting storage...
    {:else}
      {#if !storageAllowed}
        Storage denied, user and room settings will not be persistent.
        <Button on:click={()=>{ready=true}} icon='okay'/>
      {/if}
    {/if}
    {#if error}
      <span>{error}</span>
    {/if}
  </section>
</main>

<style>

</style>
