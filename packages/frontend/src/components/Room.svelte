<script type='ts'>
  import { ChatHistory, mkLeaveRoomMessage, mkPeerChatMessage, mkPeerColorMessage, mkPeerNameMessage } from "@extero/common/dist/src/api"

  import type { Comrade } from "../comrade"
  import ComradeView from "./ComradeView.svelte"
  import SplitPane from "./SplitPane.svelte"
  import type { Media } from "../media"

  import type { UserI } from "../types/user"
  import type { Store } from "../stores/localStore"

  import { toMarkdown } from '../markdown'
  import { playSound } from "../sounds"
  import { onMount } from "svelte"

  export let websocket: WebSocket

  export let medias: Media[] = []
  export let room: string
  export let comrades: Comrade[]
  export let userStorage: Store<UserI>
  export let chatHistory: ChatHistory[]
  export let muteAudio: boolean
  export let muteVideo: boolean

  $: gridCols = `repeat(${1+Math.floor(comrades.length/2)}, minmax(0, 1fr))`
  $: gridRows = `repeat(${Math.ceil(comrades.length/2)}, minmax(0, 1fr))`

  let pendingChatInput: string = ''

  function onChatInputKeyUp(e: KeyboardEvent) {
    if (e.code === 'Enter') {
      sendChat()
    }
  }
  function sendChat() {
    if (!pendingChatInput) return

    for (let comrade of comrades) {
      comrade.dataConnection.send(mkPeerChatMessage(pendingChatInput))
    }

    // Also add it to our own chat history.
    chatHistory.push({
      from: $userStorage.name,
      content: pendingChatInput,
      renderedContent: toMarkdown(pendingChatInput),
      timestamp: new Date(),
    })
    chatHistory = [...chatHistory]
    playSound('chat')

    pendingChatInput = ''
  }

  let nameColors: Record<string, string> = {}
  function getNameColor(name: string): string {
    if (nameColors[name]) return nameColors[name]

    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    let c = '#'
    for (let i = 0; i < 3; i++) {
      let value = (hash >> (i * 8)) & 0xFF
      c += ('00' + value.toString(16)).substr(-2)
    }
    nameColors[name] = c
    return c
  }
  function getComradeColor(comrade: Comrade): string {
    if (!comrade.color) return getNameColor(comrade.name)
    return comrade.color
  }
  function getSelfColor(color?: string): string {
    if (!color) return getNameColor($userStorage.name)
    return color
  }
  function findComradeColorFromName(name: string): string {
    if (name === $userStorage.name) return getSelfColor($userStorage.color)
    let comrade = comrades.find(v=>v.name === name)
    if (comrade) {
      return getComradeColor(comrade)
    }
    return getNameColor(name)
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

  function toggleAudio() {
    muteAudio = !muteAudio
    for (let media of medias) {
      if (media.stream) {
        for (let track of media.stream.getAudioTracks()) {
          track.enabled = !muteAudio
        }
      }
    }
  }
  function toggleVideo() {
    muteVideo = !muteVideo
    for (let media of medias) {
      if (media.stream) {
        for (let track of media.stream.getVideoTracks()) {
          track.enabled = !muteVideo
        }
      }
    }
  }
  function leaveRoom() {
    websocket?.send(JSON.stringify(
      mkLeaveRoomMessage(room)
    ))
  }

  let editUsername: boolean = false
  let pendingUsername: string = ''
  function startEditUsername() {
    editUsername = true
    pendingUsername = $userStorage.name
  }
  function cancelEditUsername() {
    editUsername = false
  }
  function commitPendingUsername() {
    $userStorage.name = pendingUsername
    for (let c of comrades) {
      c.dataConnection.send(mkPeerNameMessage($userStorage.name))
    }
    editUsername = false
  }
  function usernameKeyup(e: KeyboardEvent) {
    if (e.code === 'Enter') {
      commitPendingUsername()
    } else if (e.code === 'Escape') {
      cancelEditUsername()
    }
  }

  // Send network updates when we change our usercolor.
  function updateColor() {
    for (let c of comrades) {
      c.dataConnection.send(mkPeerColorMessage($userStorage.color))
    }
  }

  onMount(() => {
    playSound('self_join')
    return () => {
      playSound('self_leave')
    }
  })
</script>

<main>
  <SplitPane pos={80} type='horizontal'>
    <section slot='a' class='feed' style="grid-template-rows: {gridRows}; grid-template-columns: {gridCols};">
      {#each comrades.filter(v=>v.inboundMedias.length>0) as comrade}
        <section class='comrade-feed'>
          <div style="color: {getComradeColor(comrade)}" class='comrade-feed-name'>
            {comrade.name}
          </div>
          <ComradeView comrade={comrade}></ComradeView>
        </section>
      {/each}
    </section>
    <section slot='b' class='soapbox'>
      <section class='settings'>
        <nav>
          <button class:muted={muteAudio} on:click={toggleAudio}>{muteAudio?'un':''}mute audio</button>
          <button class:muted={muteVideo} on:click={toggleVideo}>{muteVideo?'un':''}mute video</button>
          <button on:click={leaveRoom}>leave</button>
        </nav>
        <section class='self-video'>
          {#each medias as media}
            {#if media.stream}
              <video use:srcObject={media.stream} autoplay playsinline muted>
                <track kind='captions'>
              </video>
            {/if}
          {/each}
        </section>
      </section>
      <section class='comrades'>
        <div style="color: {getSelfColor($userStorage.color)}" class='comrade-chat self'>
          <div class='comrade-chat-image'>
            {#if $userStorage.image}
              <img src={$userStorage.image} alt={$userStorage.name} />
            {/if}
          </div>
          <div>
            {#if editUsername}
              <input type='text' bind:value={pendingUsername} on:keyup={usernameKeyup}>
              <span on:click={cancelEditUsername}>🚫️</span>
              <span on:click={commitPendingUsername}>✔️</span>
            {:else}
              <span>{$userStorage.name}</span>
              <span on:click={startEditUsername}>✏️</span>
            {/if}
            <input type='color' bind:value={$userStorage.color} on:change={updateColor}/>
          </div>
        </div>
        {#each comrades as comrade}
          <div style="color: {getComradeColor(comrade)}" class='comrade-chat'>
            <div class='comrade-chat-image'>
              {#if comrade.image}
                <img src={comrade.image} alt={comrade.name} />
              {/if}
            </div>
            <div class='comrade-chat-name'>
              {comrade.name}
            </div>
          </div>
        {/each}
      </section>
      <section class='chat'>
        {#each chatHistory as chat}
          <div class='chat-message'>
            <div style="color: {findComradeColorFromName(chat.from)}" class='chat-message-from'>
              {chat.from}
              <span class='chat-message-date'>
                {chat.timestamp.toLocaleString()}
              </span>
            </div>
            <div class='chat-message-content'>
              {#if chat.renderedContent}
                {@html chat.renderedContent}
              {:else}
                {chat.content}
              {/if}
            </div>
          </div>
        {/each}
      </section>
      <section class='chat-input'>
        <input type='text' bind:value={pendingChatInput} on:keyup={onChatInputKeyUp}>
        <button on:click={sendChat}>Send</button>
      </section>
    </section>
  </SplitPane>
</main>

<style>
  main {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
  .feed {
    display: grid;
    grid-gap: .5em;
  }
  .comrade-feed {
    position: relative;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: minmax(0, 1fr);
  }
  button.muted {
    background: red;
  }
  .comrade-feed-name {
    position: absolute;
    top: 1em;
    left: 1em;
    background: rgba(0, 0, 0, 0.75);
    color: rgb(200, 200, 200);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: .25em;
    padding: .5em;
    z-index: 1;
  }
  .chat {
    overflow: auto;
  }
  .chat-message {
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    flex-direction: column;
    padding: 0 1em;
    margin-bottom: .25em;
  }
  .chat-message-from {
    font-weight: bold;
  }
  .chat-message-date {
    color: rgb(200, 200, 200);
    opacity: 0.25;
    font-size: 75%;
    margin-left: 1em;
  }
  .chat-message-date:hover {
    opacity: 0.5;
  }
  .chat-message-content {
    margin-left: 1em;
    word-break: break-word;
  }
  .comrades {
    padding: 1em;
    background: rgba(32, 32, 32, 0.5);
    margin: 0 1em 1em 1em;
  }
  .comrade-chat.self {
    font-weight: bold;
  }
  .comrade-chat {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
  }
  .comrade-chat-image {
    width: 2em;
    height: 2em;
  }
  .comrade-chat-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .soapbox {
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
  }
  .chat-input {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr) auto;
  }
  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .settings {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
  }
  .settings video {
    max-width: 320px;
    max-height: 240px;
  }
</style>