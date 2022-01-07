<script type='ts'>
  import { onMount } from "svelte"
  import Peer, { DataConnection } from 'peerjs'
  import { isHelloMessage, isJoinRoomMessage, isMemberJoinMessage, isMemberLeftMessage, isPeerChatMessage, isPeerMediaAdvertise, isPeerMediaRequest, isPeerNameMessage, mkHelloMessage, mkJoinRoomMessage, mkPeerChatMessage, mkPeerMediaAdvertise, mkPeerNameMessage } from '@extero/common/src/api'
  import type { Comrade } from "../comrade"
  import type { Media } from "../media"

  export let username: string

  export let peerID: string
  export let localPeer: Peer
  export let comrades: Comrade[] = []
  export let medias: Media[] = []

  function addComrade(p: Peer.DataConnection) {
    let comrade = {
      name: 'pending comrade',
      peerID: p.peer,
      mediaConnections: [],
      dataConnection: p,
    }
    comrades.push(comrade)
    p.on('open', () => {
      console.log('opened peer conn', p)
      p.send(mkPeerNameMessage(username))
      // Advertise our current media sources.
      for (let m of medias) {
        p.send(mkPeerMediaAdvertise(m.mediaType, m.uuid))
      }
    })
    p.on('error', () => {
      console.error('lost connection to', p)
      removeComrade(p.peer)
    })
    p.on('data', (data: any) => {
      if (isPeerNameMessage(data)) {
        console.log(comrade.name, 'is now', data.name)
        comrade.name = data.name
      } else if (isPeerChatMessage(data)) {
        console.log('chat from', comrade.name, ':', data.content)
      } else if (isPeerMediaAdvertise(data)) {
        console.log('got media advertise', data)
        // TODO: Gauge how much media we want to consume. For now accept primary/camera and/or secondary/desktop/window only.
      } else if (isPeerMediaRequest(data)) {
        console.log('got media request', data)
      }
      console.log('got peer data', data)
    })
    console.log('added comrade', comrade)
  }
  function removeComrade(id: string) {
    let i = comrades.findIndex(v=>v.peerID === id)
    if (i === -1) return
    console.log('removed comrade', comrades[i])
    for (let mediaChannel of comrades[i].mediaConnections) {
      mediaChannel.close()
    }
    comrades[i].dataConnection.close()
    comrades.splice(i, 1)
  }
  export let websocket: WebSocket
  export let ready: boolean
  let desiredRoom: string
  export let room: string
  export let roomReady: boolean
  let error: boolean

  $: {
    if (roomReady && room) {
      websocket?.send(JSON.stringify(
        mkJoinRoomMessage(desiredRoom)
      ))
    }
  }

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
          addComrade(dc)
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
          } else if (isMemberJoinMessage(msg)) {
            addComrade(localPeer.connect(msg.peerID, {
              serialization: 'json',
              reliable: true,
            }))
          } else if (isMemberLeftMessage(msg)) {
            removeComrade(msg.peerID)
          }
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