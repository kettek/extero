<script type='ts'>
  import { onMount } from "svelte"

  export let websocket: WebSocket
  export let ready: boolean
  export let room: string
  let error: boolean

  onMount(async () => {
    const parsedUrl = new URL(window.location.href)
    console.log(parsedUrl)
    room = parsedUrl?.search.substring(1)
    try {
      await new Promise((resolve: (value: void) => void, reject: (reason: any) => void) => {
        websocket = new WebSocket(`wss://${parsedUrl.hostname}:3001`)
        websocket.onerror = (event: Event) => {
          reject(event)
        }
        websocket.onclose = (event: CloseEvent) => {
          websocket = undefined
          console.log('got close')
          ready = false
          // TODO: reconnect?
        }
        websocket.onopen = (event: Event) => {
          console.log('got open')
          resolve()
        }
      })
      ready = true
      console.log('connected')
    } catch(e: any) {
      error = true
      console.error(e.target)
    }
  })
</script>

{#if !ready}
  <main>
    <section>
      <aside>Connecting to room manager...</aside>
      {#if error}
        Got an error, check the console.
      {/if}
    </section>
  </main>
{/if}