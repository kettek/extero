<script type='ts'>
  import { uniqueNamesGenerator, colors, starWars } from 'unique-names-generator'

  export let nameReady: boolean = false
  export let username: string = uniqueNamesGenerator({
    dictionaries: [colors, starWars],
    separator: ' ',
    style: 'capital',
  })
</script>

<main>
  <section>
    <label>
      <span>Name</span>
      <input type='text' bind:value={username}/>
    </label>
  </section>
  <button on:click={()=>nameReady=true}>okay</button>
</main>

<style>
</style>