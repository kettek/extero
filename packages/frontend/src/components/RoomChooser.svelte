<script type='ts'>
import { onMount } from 'svelte';

  import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator'
  import Button from './Button.svelte'

  export let roomReady: boolean = false
  export let room: string = ''
  let desiredRoom: string = ''

  function joinRoom() {
    room = desiredRoom
    roomReady = true
    let newRelativePathQuery = window.location.pathname + '?' + room
    history.pushState(null, '', newRelativePathQuery);
  }

  onMount(() => {
    // FIXME: Add room name negotiation.
    const parsedUrl = new URL(window.location.href)
    desiredRoom = parsedUrl?.search.substring(1)
    if (!desiredRoom) {
      desiredRoom = uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
        separator: '',
        style: 'capital',
      })
    }
  })
</script>

<main>
  <section>
    <label>
      <span>Room</span>
      <input type='text' bind:value={desiredRoom}/>
    </label>
  </section>
  <nav>
    <Button on:click={joinRoom} icon='okay'/>
  </nav>
</main>

<style>
  main {
  }
  nav {
    display: flex;
    justify-content: flex-end;
  }
</style>