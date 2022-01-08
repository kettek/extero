<script type='ts'>
  import { ChatHistory, mkPeerChatMessage } from "@extero/common/src/api"

  import type { Comrade } from "../comrade"
  import ComradeView from "./ComradeView.svelte"
  import SplitPane from "./SplitPane.svelte"


  export let room: string
  export let comrades: Comrade[]
  export let username: string
  export let chatHistory: ChatHistory[]

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
      from: username,
      content: pendingChatInput,
      timestamp: new Date(),
    })
    chatHistory = [...chatHistory]

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
</script>

<main>
  <SplitPane pos={80} type='horizontal'>
    <section slot='a' class='feed' style="grid-template-rows: {gridRows}; grid-template-columns: {gridCols};">
      {#each comrades.filter(v=>v.inboundMedias.length>0) as comrade}
        <section class='comrade-feed'>
          <div style="color: {getNameColor(comrade.name)}" class='comrade-feed-name'>
            {comrade.name}
          </div>
          <ComradeView comrade={comrade}></ComradeView>
        </section>
      {/each}
    </section>
    <section slot='b' class='soapbox'>
      <section class='comrades'>
        <div style="color: {getNameColor(username)}" class='comrade-name self'>{username}</div>
        {#each comrades as comrade}
          <div style="color: {getNameColor(comrade.name)}" class='comrade-name'>
            {comrade.name}
          </div>
        {/each}
      </section>
      <section class='chat'>
        {#each chatHistory as chat}
          <div class='chat-message'>
            <div style="color: {getNameColor(chat.from)}" class='chat-message-from'>
              {chat.from}
              <span class='chat-message-date'>
                {chat.timestamp.toLocaleString()}
              </span>
            </div>
            <div class='chat-message-content'>
              {chat.content}
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
  .comrade-name.self {
    font-weight: bold;
  }
  .soapbox {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
  .chat-input {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
  }
  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>