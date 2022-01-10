<script type='ts'>
  import { uniqueNamesGenerator, colors, starWars } from 'unique-names-generator'
  import { localStore, Store } from '../stores/localStore'
  import type { UserI } from '../types/user'

  export let storage: Store<UserI> = localStore<UserI>('user', {
    name: '',
    color: '',
    image: '',
  })
  export let nameReady: boolean = false

  if ($storage.name === '') {
    randomizeName()
  }

  function randomizeName() {
    $storage.name = uniqueNamesGenerator({
      dictionaries: [colors, starWars],
      separator: ' ',
      style: 'capital',
    })
  }
</script>

<main>
  <section>
    <label>
      <span>Name</span>
      <input type='text' bind:value={$storage.name}/>
      <button on:click={randomizeName}>🎲</button>
    </label>
    <label>
      <span>Color</span>
      <input type='color' bind:value={$storage.color}/>
    </label>
  </section>
  <nav>
    <button on:click={()=>nameReady=true}>okay</button>
  </nav>
</main>

<style>
  section {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
  }
  label {
    display: flex;
    align-items: center;
  }
  label span {
    min-width: 4em;
  }
  nav {
    display: flex;
    justify-content: flex-end;
  }
</style>