<script type='ts'>
  import { uniqueNamesGenerator, colors, starWars } from 'unique-names-generator'
  import { localStore, Store } from '../stores/localStore'
  import type { UserI } from '../types/user'

  export let storage: Store<UserI> = localStore<UserI>('user', {
    name: '',
    color: '',
    image: '',
  })

  if ($storage.name === '') {
    $storage.name = uniqueNamesGenerator({
      dictionaries: [colors, starWars],
      separator: ' ',
      style: 'capital',
    })
  }

  export let nameReady: boolean = false
</script>

<main>
  <section>
    <label>
      <span>Name</span>
      <input type='text' bind:value={$storage.name}/>
    </label>
    <label>
      <input type='color' bind:value={$storage.color}/>
    </label>
  </section>
  <button on:click={()=>nameReady=true}>okay</button>
</main>

<style>
</style>