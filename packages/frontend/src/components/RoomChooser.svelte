<script type='ts'>
import { onMount } from 'svelte';

  import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator'

  export let roomReady: boolean = false
  export let room: string = ''

  onMount(() => {
    // FIXME: Add room name negotiation.
    const parsedUrl = new URL(window.location.href)
    let desiredRoom = parsedUrl?.search.substring(1)
    if (!desiredRoom) {
      desiredRoom = uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
        separator: '',
        style: 'capital',
      })
      let newRelativePathQuery = window.location.pathname + '?' + name
      history.pushState(null, '', newRelativePathQuery);
      room = desiredRoom
    } else {
      room = desiredRoom
      roomReady = true
    }
  })
</script>

<main>
  <section>
    <label>
      <span>Room</span>
      <input type='text' bind:value={room}/>
    </label>
  </section>
  <button on:click={()=>roomReady=true}>okay</button>
</main>

<style>
</style>