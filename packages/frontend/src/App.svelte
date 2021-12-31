<script lang="ts">
	import { v4 } from 'uuid'
	import { onMount } from 'svelte'
	import DeviceChooser from './components/DeviceChooser.svelte'
import { Server } from 'ws'
import ServerConnector from './components/ServerConnector.svelte'

	let initErrors: Error[] = []

	let websocket: WebSocket
	let room: string = ''
	let serverReady: boolean = false

	let videoDevice: string = ''
	let videoWidth: number = 1920
	let videoHeight: number = 1080
	let videoFramerate: number = 30
	let videoFacing: 'user' | 'environment' = 'user'
	let audioDevice: string = ''
	let devicesReady: boolean = false

	let roomReady: boolean = false

	// Init sets up initial state.
	async function init() {
		try {
			/*await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: {
					width: { min: 1024, ideal: 1280, max: 1920 },
					height: { min: 576, ideal: 720, max: 1080 },
				}
			})*/
		} catch(e: any) {
			console.error(e)
		}
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
			<article>
				<ServerConnector bind:websocket bind:ready={serverReady} bind:room={room}></ServerConnector>
				{#if serverReady}
					{#if !devicesReady}
						<DeviceChooser bind:videoDevice bind:videoWidth bind:videoHeight bind:videoFacing bind:videoFramerate bind:audioDevice bind:ready={devicesReady}></DeviceChooser>
					{:else}
						{#if !roomReady}
							Waiting for room...
						{:else}
							Got room
						{/if}
					{/if}
				{/if}
			</article>
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
