<script type='ts'>
  import { onMount } from "svelte"
  import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator'
  import Peer, { DataConnection } from 'peerjs'
  import { isHelloMessage, isJoinRoomMessage, isMemberJoinMessage, isMemberLeftMessage, mkHelloMessage, mkJoinRoomMessage } from '@extero/common/src/api'

  export let peerID: string
  export let localPeer: Peer
  export let peers: [Peer.DataConnection, Peer.MediaConnection[]][] = []
  function addPeer(p: Peer.DataConnection) {
    peers.push([p, []])
    p.on('open', () => {
      console.log('opened peer conn', p)
      // TODO: Add/request media channels!
    })
    p.on('error', () => {
      console.error('lost connection to', p)
      removePeer(p.peer)
    })
    console.log('added peer', peers[peers.length-1])
  }
  function removePeer(id: string) {
    let p = peers.findIndex(v=>v[0].peer===id)
    if (p === -1) return
    console.log('removed peer', peers[p])
    peers[p][0].close()
    for (let mediaChannel of peers[p][1]) {
      mediaChannel.close()
    }
    peers.splice(p, 1)
  }
  export let websocket: WebSocket
  export let ready: boolean
  let desiredRoom: string
  export let room: string
  export let roomReady: boolean
  let error: boolean

  $: desiredRoom ? websocket?.send(JSON.stringify(mkJoinRoomMessage(desiredRoom))) : null

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
          addPeer(dc)
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
          websocket.send(JSON.stringify(
            mkHelloMessage(peerID)
          ))
          resolve()
        }
        websocket.onmessage = (event: MessageEvent) => {
          let msg = JSON.parse(event.data)
          console.log('got', msg)
          if (isHelloMessage(msg)) {
          } else if (isJoinRoomMessage(msg)) {
            if (msg.success) {
              room = msg.room
              roomReady = true
            }
            /*for (let m of msg.members) {
              if (!peers.find(v=>v[0].peer === m)) {
                addPeer(localPeer.connect(m))
              }
            }*/
            // TODO: For each member, connect as a peer.
          } else if (isMemberJoinMessage(msg)) {
            addPeer(localPeer.connect(msg.peerID))
          } else if (isMemberLeftMessage(msg)) {
            removePeer(msg.peerID)
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