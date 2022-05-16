<script type='ts'>
  import { ChatHistory, mkLeaveRoomMessage, mkPeerChatMessage, mkPeerColorMessage, mkPeerNameMessage, mkPeerMediaStateMessage } from "@extero/common/dist/src/api"

  import type { Comrade } from "../comrade"
  import ComradeView from "./ComradeView.svelte"
  import SplitPane from "./SplitPane.svelte"
  import FileSender from "./FileSender.svelte"
  import type { Media } from "../media"

  import type { UserI } from "../types/user"
  import type { Store } from "../stores/localStore"
  import { mediaStore } from "../stores/media"

  import { toMarkdown } from '../markdown'
  import { playSound } from "../sounds"
  import { onMount } from "svelte"
  import Window from "./Window.svelte"
  import { chatStore } from "../stores/chat"
  import SelfView from "./SelfView.svelte"
  import { windowStore } from "../stores/windows"
  import Game from "./Game.svelte"
  import { ActionEvent, Actions } from "../shared/emitters/actions"
  import Button from "./Button.svelte"

  export let websocket: WebSocket

  export let room: string
  export let comrades: Comrade[]
  export let userStorage: Store<UserI>
  export let muteAudio: boolean
  export let muteVideo: boolean
  let sendFiles: boolean = false

  $: gridCols = `repeat(${1+Math.floor(comrades.length/2)}, minmax(0, 1fr))`
  $: gridRows = `repeat(${Math.ceil(comrades.length/2)}, minmax(0, 1fr))`

  let pendingChatInput: string = ''
  let chatElement: HTMLElement
  let chatInputElement: HTMLInputElement
  let isChatFocused: boolean = false

  let scrollTimeout: number
  let isScrolling: boolean = false
  $: {
    if ($chatStore && chatElement) {
      if (isScrolling || chatElement.scrollHeight - chatElement.scrollTop - chatElement.clientHeight < 20) {
        isScrolling = true
        if (scrollTimeout) {
          window.clearTimeout(scrollTimeout)
        }
        scrollTimeout = window.setTimeout(() => {
          isScrolling = false
        }, 200)
        window.setTimeout(() => {
          chatElement.scrollTo({
            top: chatElement.scrollHeight,
            behavior: 'smooth',
          })
        }, 0)
      }
    }
  }

  function onChatInputKeyUp(e: KeyboardEvent) {
    if (e.code === 'Enter') {
      actions.trigger('send chat')
    } else if (e.code === 'Escape') {
      actions.trigger('blur chat')
    }
  }
  function sendChat() {
    if (!pendingChatInput) return

    for (let comrade of comrades) {
      comrade.dataConnection.send(mkPeerChatMessage(pendingChatInput))
    }

    // Also add it to our own chat history.
    chatStore.push({
      from: $userStorage.name,
      content: pendingChatInput,
      renderedContent: toMarkdown(pendingChatInput),
      timestamp: new Date(),
    })
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

  function toggleAudio() {
    muteAudio = !muteAudio
    for (let media of $mediaStore) {
      if (media.stream) {
        for (let track of media.stream.getAudioTracks()) {
          track.enabled = !muteAudio
        }
      }
      for (let c of comrades) {
        c.dataConnection.send(mkPeerMediaStateMessage(media.uuid, muteVideo, muteAudio))
      }
    }
  }
  function toggleVideo() {
    muteVideo = !muteVideo
    for (let media of $mediaStore) {
      if (media.stream) {
        for (let track of media.stream.getVideoTracks()) {
          track.enabled = !muteVideo
        }
      }
      for (let c of comrades) {
        c.dataConnection.send(mkPeerMediaStateMessage(media.uuid, muteVideo, muteAudio))
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

  let actions: Actions = new Actions()
  function onAction(event: ActionEvent): boolean {
    switch (event.which) {
      case 'focus chat':
        chatInputElement.focus()
        break
      case 'blur chat':
        chatInputElement.blur()
        break
      case 'send chat':
        sendChat()
        break
      case 'mute':
        toggleVideo()
        toggleAudio()
        break
      case 'mute audio':
        toggleAudio()
        break
      case 'mute video':
        toggleVideo()
        break
      case 'files':
        sendFiles = !sendFiles
        break
      case 'leave':
        leaveRoom()
        break
    }
    return true
  }

  onMount(() => {
    playSound('self_join')

    let actionDefinitions = {
      'focus chat': ['Enter', 'i'],
      'blur chat': ['Escape'],
      'send chat': [],
      'mute': ['m'],
      'mute audio': ['a'],
      'mute video': ['v'],
      'files': ['f'],
      'leave': ['l'],
    }

    actions.hook()
    actions.bind(Object.keys(actionDefinitions), onAction)
    actions.register(actionDefinitions)

    return () => {
      playSound('self_leave')
      actions.unregister(actionDefinitions)
      actions.unbind(Object.keys(actionDefinitions), onAction)
      actions.unhook()
    }
  })
</script>

<main>
  <SplitPane pos={80} type='horizontal'>
    <section slot='a' class='feed' style="grid-template-rows: {gridRows}; grid-template-columns: {gridCols};">
      {#if comrades.length === 0}
        <Game></Game>
      {:else}
        {#each comrades.filter(v=>v.inboundMedias.length>0) as comrade}
          <section class='comrade-feed'>
            <div style="color: {getComradeColor(comrade)}" class='comrade-feed-name'>
              {comrade.name}
            </div>
            <ComradeView comrade={comrade}></ComradeView>
          </section>
        {/each}
      {/if}
    </section>
    <section slot='b' class='soapbox'>
      <header class='title'>
        <span>
          extero
        </span>
        <nav>
          <Button on:click={()=>windowStore.show('settings')} icon='settings'/>
          <Button on:click={leaveRoom} icon='leave' alt='Leave'/>
        </nav>
      </header>
      <section class='settings'>
        <section class='self-video'>
          <SelfView actions={actions} bind:muteAudio bind:muteVideo></SelfView>
        </section>
      </section>
      <section class='comrades'>
        <div style="color: {getSelfColor($userStorage.color)}" class='comrade-chat self'>
          <div class='comrade-chat-image'>
            {#if $userStorage.image}
              <img src={$userStorage.image} alt={$userStorage.name} />
            {/if}
          </div>
          <div class='comrade-chat-self-name'>
            {#if editUsername}
              <input type='text' bind:value={pendingUsername} on:keyup={usernameKeyup}>
              <Button on:click={cancelEditUsername} icon='cancel' alt='cancel'/>
              <Button on:click={commitPendingUsername} icon='okay' alt='change'/>
            {:else}
              <span>{$userStorage.name}</span>
              <Button on:click={startEditUsername} icon='edit' alt='change name'/>
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
        <div class='comrade-chat-options'>
          <Button on:click={()=>{sendFiles = true}} icon='files' alt='send Files'/>
        </div>
      </section>
      <section class='chat' bind:this={chatElement}>
        {#each $chatStore as chat}
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
        <input bind:this={chatInputElement} type='text' bind:value={pendingChatInput} on:keyup={onChatInputKeyUp} placeholder={isChatFocused?'':'hit enter or i to focus'} on:focus={()=>isChatFocused=true} on:blur={()=>isChatFocused=false}>
        <Button on:click={sendChat} icon='send'/>
      </section>
    </section>
  </SplitPane>
</main>
{#if sendFiles}
<Window>
  <FileSender comrades={comrades}></FileSender>
  <Button on:click={()=>{sendFiles=false}} icon='close'/>
</Window>
{/if}

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
    justify-content: flex-start;
    flex-direction: column;
    padding: 0 1em;
    margin-bottom: .25em;
  }
  .chat-message-from {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
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
  .comrade-chat-self-name {
    display: flex;
    align-items: center;
  }
  .soapbox {
    display: grid;
    grid-template-rows: auto auto auto minmax(0, 1fr) auto;
  }
  header.title {
    background: #111;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
  }
  header.title span {
    text-align: center;
    font-size: 200%;
    font-weight: 600;
  }
  header.title button {
    border: 0;
    background: none;
		cursor: pointer;
  }
  .chat-input {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    width: 100%;
  }
  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .settings {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
  }
  .settings video {
    max-width: 320px;
    max-height: 240px;
  }
  .underline {
    text-decoration: underline;
  }
</style>