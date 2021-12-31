<script lang="ts">
	import { v4 } from 'uuid'
	import { onMount } from 'svelte'

	let initErrors: Error[] = []

	// Init sets up initial state.
	async function init() {
	}

	// Restore sets up and restores and previous session data.
	async function restore() {
	}

	onMount(async () => {
		await init()
		await restore()
	})
</script>

<main>
	{#if initErrors.length > 0}
		<section>
			<header>Error</header>
			<article>
				<p>
					One or more errors occurred during initialization.

					{#each initErrors as error}
						<pre>{error}</pre>
					{/each}
				</p>
			</article>
		</section>
	{:else}
		<section>
			<header>extero</header>
		</section>
	{/if}
</main>

<style>
	main {
		width: 100%;
		height: 100%;
		background-color: #222;
		color: #aaa;
		display: grid;
		align-items: center;
		justify-content: center;
	}
	section {
		display: grid;
		align-items: center;
		justify-content: center;
		grid-template-rows: auto minmax(0, 1fr);
		padding: 1em;
		background: #111;
	}
	header {
		text-align: center;
		font-size: 200%;
		font-weight: 600;
	}
	article {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		padding: .5em;
		max-width: 70ch;
	}
	input {
		width: 100%;
	}
</style>
