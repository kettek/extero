<script type='ts'>
  import type { Comrade } from "../comrade"


  export let room: string
  export let comrades: Comrade[]
  export let username: string

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
</script>

<main>
  <section class='feed'>
    {#each comrades as comrade}
      <section class='comrade-feed'>
        {#each comrade.inboundMedias as inbound}
          {#if inbound.stream}
            <video use:srcObject={inbound.stream} autoplay playsinline>
              <track kind='captions'>
            </video>
          {/if}
        {/each}
      </section>
    {/each}
  </section>
  <section class='soapbox'>
    <section class='comrades'>
      <div class='comrade-name self'>{username}</div>
      {#each comrades as comrade}
        <div class='comrade-name'>
          {comrade.name}
        </div>
      {/each}
    </section>
    <section class='chat'>
      chat
    </section>
    <section class='input'>
    </section>
  </section>
</main>

<style>
  main {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .feed {
  }
  .comrade-feed {
  }
  .comrade-name {
  }
  .comrade-name.self {
    font-weight: bold;
  }
  .soapbox {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
</style>