<script type='ts'>
  import { uniqueNamesGenerator, colors, starWars } from 'unique-names-generator'

  export let nameReady: boolean = false
  export let username: string = uniqueNamesGenerator({
    dictionaries: [colors, starWars],
    separator: ' ',
    style: 'capital',
  })
  export let usercolor: string
</script>

<main>
  <section>
    <label>
      <span>Name</span>
      <input type='text' bind:value={username}/>
    </label>
    <label>
      <input type='color' bind:value={usercolor}/>
    </label>
  </section>
  <button on:click={()=>nameReady=true}>okay</button>
</main>

<style>
</style>