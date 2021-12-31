<script type='ts'>
  import { onMount } from "svelte"
  import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator'
  import Peer, { DataConnection } from 'peerjs'

  export let peerID: string
  export let localPeer: Peer
  export let websocket: WebSocket
  export let ready: boolean
  let desiredRoom: string
  export let room: string
  export let roomReady: boolean
  let error: boolean

  $: desiredRoom ? websocket?.send(JSON.stringify({type: 'join-room', room: desiredRoom })) : null

  onMount(async () => {
    const parsedUrl = new URL(window.location.href)
    try {
      await new Promise((resolve: (value: void) => void, reject: (reason: any) => void) => {
        localPeer = new Peer({
          host: window.location.hostname,
          port: Number(window.location.port),
          path: '/peer',
        })

        localPeer.on('open', (id: string) => {
          console.log("peer open")
          peerID = id
          resolve()
        })
        localPeer.on('disconnected', () => {
          console.log("peer disconnected")
          // TODO: Reconnect?
        })
        localPeer.on('error', (err: any) => {
          console.log('peer error')
          console.error(err)
          reject(err)
        })
        localPeer.on('connection', (dc: DataConnection) => {
          console.log('we are connected to', dc)
        })
        localPeer.on('call', (mc: Peer.MediaConnection) => {
          console.log('got call', mc)
        })
      })
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
          websocket.send(JSON.stringify({
            type: 'hello',
            peerID,
          }))
          resolve()
        }
        websocket.onmessage = (event: MessageEvent) => {
          let msg = JSON.parse(event.data)
          console.log('got', msg)
          if (msg.type === 'join-room') {
            if (msg.success) {
              room = msg.room
              roomReady = true
            }
            for (let m of msg.members) {
              localPeer.connect(m)
              // TODO: Move to separate Member connection manager, wherein we can reset the media stream if we change devices, etc.
            }
            // TODO: For each member, connect as a peer.
          } else if (msg.type === 'member-join') {
            // TODO: Connect as a peer.
          } else if (msg.type === 'member-leave') {
            // TODO: Remove as a peer.
          }
        }
      })
      desiredRoom = parsedUrl?.search.substring(1)
      if (!desiredRoom) {
        let name = uniqueNamesGenerator({
          dictionaries: [adjectives, colors, animals],
          separator: '',
          style: 'capital',
        })

        let newRelativePathQuery = window.location.pathname + '?' + name
        history.pushState(null, '', newRelativePathQuery);
        desiredRoom = name
        // FIXME: Add room name negotiation.
      }
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