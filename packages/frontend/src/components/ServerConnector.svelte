<script type='ts'>
  import { onMount } from "svelte"
  import Peer, { DataConnection, MediaConnection } from 'peerjs'
  import { ChatHistory, isHelloMessage, isJoinRoomMessage, isMemberJoinMessage, isMemberLeftMessage, isPeerChatMessage, isPeerColorMessage, isPeerMediaAdvertise, isPeerMediaRequest, isPeerNameMessage, MediaType, mkHelloMessage, mkJoinRoomMessage, mkPeerChatMessage, mkPeerColorMessage, mkPeerMediaAdvertise, mkPeerMediaRequest, mkPeerNameMessage, mkPeerImageMessage, isPeerImageMessage, isPeerSendAdvertise, isPeerSendRequest, isPeerSendResponse, mkPeerSendResponse, PeerFile, isPeerSendReject, isPeerSendReceive, mkPeerSendReceive, isPeerMediaStateMessage } from '@extero/common/dist/src/api'
  import type { Comrade, MediaReference } from "../comrade"
  import type { Media } from "../media"

  import { fileStore, PendingReceive, PendingSend } from "../stores/files"
  import { mediaStore } from "../stores/media"

  import { toMarkdown } from '../markdown'
  import { playSound } from '../sounds'

  import type { UserI } from "../types/user"
  import type { Store } from "../stores/localStore"
  import { chatStore } from "../stores/chat"

  export let localPeer: Peer
  export let comrades: Comrade[] = []
  export let userStorage: Store<UserI>
  let peerID: number

  function refreshComrades() {
    comrades = [...comrades]
  }

  function addComrade(p: Peer.DataConnection) {
    if (comrades.find(v=>v.peerID===p.peer)) {
      console.error(new Error('attempted to add comrade when an existing comrade with the same peer ID exists'))
      return
    }
    let comrade: Comrade = {
      name: 'pending comrade',
      peerID: p.peer,
      outboundMedias: [],
      inboundMedias: [],
      dataConnection: p,
      volume: 100,
      color: '',
    }
    comrades.push(comrade)
    p.on('open', () => {
      console.log('opened peer conn', p)
      p.send(mkPeerNameMessage($userStorage.name))
      p.send(mkPeerColorMessage($userStorage.color))
      p.send(mkPeerImageMessage($userStorage.image))
      // Advertise our current media sources.
      for (let m of $mediaStore) {
        p.send(mkPeerMediaAdvertise(m.mediaType, m.uuid))
      }
    })
    p.on('error', (err: any) => {
      console.error(err)
      console.error('lost connection to', p)
      removeComrade(p.peer)
    })
    p.on('data', (data: any) => {
      if (isPeerNameMessage(data)) {
        console.log(comrade.name, 'is now', data.name)
        comrade.name = data.name
      } else if (isPeerColorMessage(data)) {
        console.log(comrade.name, 'is now', data.color)
        comrade.color = data.color
      } else if (isPeerImageMessage(data)) {
        comrade.image = data.image
      } else if (isPeerChatMessage(data)) {
        chatStore.push({
          from: comrade.name,
          content: data.content,
          renderedContent: toMarkdown(data.content),
          timestamp: new Date(),
        })
        playSound('chat')
      } else if (isPeerMediaAdvertise(data)) {
        console.log('got media advertise', data)
        // TODO: Gauge how much media we want to consume. For now accept all.
        p.send(mkPeerMediaRequest(data.uuid))
      } else if (isPeerMediaRequest(data)) {
        // find it, yo.
        let media = $mediaStore.find(v=>v.uuid===data.uuid)
        if (!media) {
          throw new Error(`media request for ${data.uuid} is bogus`)
        }
        let call = localPeer.call(p.peer, media.stream, {
          metadata: {
            uuid: media.uuid,
            mediaType: media.mediaType,
          }
        })

        let outboundMediaReference = {
          uuid: media.uuid,
          mediaType: media.mediaType,
          mediaConnection: call,
          stream: undefined,
          mutedAudio: false,
          mutedVideo: false,
        }
        comrade.outboundMedias.push(outboundMediaReference)

        call.on('stream', (stream: MediaStream) => {
          console.log('got foreign stream!!!', stream)
          outboundMediaReference.stream = stream
          refreshComrades()
        })
        call.on('error', (err: any) => {
          console.log('call error', err)
          comrade.outboundMedias = comrade.outboundMedias.filter(v=>v.uuid===data.uuid)
          refreshComrades()
        })
        call.on('close', () => {
          comrade.outboundMedias = comrade.outboundMedias.filter(v=>v.uuid===data.uuid)
          refreshComrades()
        })
      } else if (isPeerMediaStateMessage(data)) {
        let m = comrade.inboundMedias.find(v=>v.uuid===data.uuid)
        if (m) {
          m.mutedAudio = data.mutedAudio
          m.mutedVideo = data.mutedVideo
        }
      } else if (isPeerSendAdvertise(data)) {
        let recvs: PendingReceive[] = []
        // Add advertised files to our receiving file store.
        for (let file of data.files) {
          console.log('adding receiving', file)
          recvs.push({
            peerID: comrade.peerID,
            file,
            status: 'pending',
          })
        }
        fileStore.addReceiving(recvs)
        playSound('offer')
      } else if (isPeerSendReject(data)) {
        for (let uuid of data.uuids) {
          fileStore.removeSending(comrade.peerID, uuid)
        }
      } else if (isPeerSendRequest(data)) {
        let files: PeerFile[] = []
        for (let uuid of data.uuids) {
          let match = $fileStore.sending.find(v=>v.file.uuid===uuid&&v.status==='pending'&&v.peerID===comrade.peerID)
          if (!match) continue
          match.status = 'sending'
          files.push(match.file)
        }
        if (files.length === 0) {
          console.error('request for 0 valid file offers!')
          return
        }
        fileStore.refresh()
        // Send
        comrade.dataConnection.send(
          mkPeerSendResponse(files)
        )
      } else if (isPeerSendReceive(data)) {
        // Peer received a file from us. Mark it as received.
        for (let uuid of data.uuids) {
          let match = $fileStore.sending.find(v=>v.file.uuid===uuid&&v.status==='sending'&&v.peerID===comrade.peerID)
          if (!match) continue
          match.status = 'sent'
        }
        fileStore.refresh()
      } else if (isPeerSendResponse(data)) {
        let received: string[] = []
        for (let file of data.files) {
          let fsFile = $fileStore.receiving.find(v=>v.file.uuid === file.uuid&&v.peerID===comrade.peerID)
          if (!fsFile) {
            console.error('comrade is sending is a file we did not request')
            continue
          }
          fsFile.receivedFile = file
          fileStore.updateReceivingStatus(comrade.peerID, file.uuid, 'received')
          received.push(file.uuid)
        }
        if (received.length > 0) {
          comrade.dataConnection.send(
            mkPeerSendReceive(received)
          )
          playSound('received')
        }
      }
      console.log('got peer data', data)
      refreshComrades()
    })
    console.log('added comrade', comrade)
    refreshComrades()
  }
  function removeComrade(id: string) {
    let i = comrades.findIndex(v=>v.peerID === id)
    if (i === -1) return
    console.log('removed comrade', comrades[i])
    for (let media of comrades[i].outboundMedias) {
      if (media.mediaConnection) media.mediaConnection.close()
    }
    for (let media of comrades[i].inboundMedias) {
      if (media.mediaConnection) media.mediaConnection.close()
    }
    comrades[i].dataConnection.close()
    comrades.splice(i, 1)
    refreshComrades()
  }
  function addComradeMedia(comrade: Comrade, mc: Peer.MediaConnection) {
    let {uuid, mediaType} = mc.metadata
    if (!uuid || !mediaType) {
      throw new Error(`comrade didn't provide the secret codes`)
    }
    let media: MediaReference = {
      uuid,
      mediaType,
      mediaConnection: mc,
      stream: undefined,
      mutedAudio: false,
      mutedVideo: false,
    }
    comrade.inboundMedias.push(media)
    mc.on('stream', (stream: MediaStream) => {
      media.stream = stream
      console.log('got stream!!!', stream)
      refreshComrades()
    })
    refreshComrades()
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
        let peerOptions: Peer.PeerJSOption = {
          host: window.location.hostname,
          path: '/peer',
        }
        if (window.location.port) {
          peerOptions.port = Number(window.location.port)
        }
        localPeer = new Peer(peerOptions)

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
          let comrade = comrades.find(v=>v.peerID === mc.peer)
          if (!comrade) {
            throw new Error(`bogus call from unknown comrade`)
          }
          // TODO: uh... okay, sure.
          mc.answer()
          addComradeMedia(comrade, mc)
        })
      })
      await new Promise((resolve: (value: void) => void, reject: (reason: any) => void) => {
        websocket = new WebSocket(`wss://${parsedUrl.hostname}:3001`)
        websocket.onerror = (event: Event) => {
          console.error(event)
          reject(event)
        }
        websocket.onclose = (event: CloseEvent) => {
          websocket = undefined
          console.log('got close', event)
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
              serialization: 'binary',
              reliable: true,
            }))
            playSound('com_join')
          } else if (isMemberLeftMessage(msg)) {
            // If the left message represents ourself, disconnect and clear out all comrades.
            if (msg.peerID === localPeer.id) {
              // Remove all our comrades.
              for (let c of comrades) {
                removeComrade(c.peerID)
              }
              // Remove our room ready status.
              room = ''
              roomReady = false
            } else {
              removeComrade(msg.peerID)
              playSound('com_leave')
            }
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
