<script lang="ts">
	import { v4 } from 'uuid'
	import { onMount } from 'svelte'
	import DeviceChooser from './components/DeviceChooser.svelte'
	import { Server } from 'ws'
	import ServerConnector from './components/ServerConnector.svelte'
	import NameChooser from './components/NameChooser.svelte'
	import RoomChooser from './components/RoomChooser.svelte'
	import type { Media } from './media'
	import MediaChooser from './components/MediaChooser.svelte'
	import type { Comrade } from './comrade'
	import Room from './components/Room.svelte'
	import type { ChatHistory } from '@extero/common/src/api'

	let initErrors: Error[] = []

	let websocket: WebSocket
	let room: string = ''
	let serverReady: boolean = false

	// TODO: Restore username from local storage.
	let username: string
	let nameReady: boolean = false

	let medias: Media[] = []
	let mediaReady: boolean = false
	let muteVideo: boolean = false
	let muteAudio: boolean = false

	let videoDevice: string = ''
	let videoWidth: number = 1920
	let videoHeight: number = 1080
	let videoFramerate: number = 30
	let videoFacing: 'user' | 'environment' = 'user'
	let audioDevice: string = ''
	let devicesReady: boolean = false
	let comrades: Comrade[]
	let chatHistory: ChatHistory[]

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
		<section class:roomReady>
			<header>extero</header>
			<article class:roomReady>
				<ServerConnector bind:websocket bind:ready={serverReady} bind:room={room} bind:roomReady={roomReady} bind:username bind:medias bind:comrades bind:chatHistory></ServerConnector>
				{#if serverReady}
					{#if !nameReady}
						<NameChooser bind:username bind:nameReady></NameChooser>
					{:else if !mediaReady}
						<MediaChooser bind:ready={mediaReady} bind:medias></MediaChooser>
					{:else if !roomReady}
						<RoomChooser bind:room bind:roomReady></RoomChooser>
					{:else}
						<Room room={room} bind:username comrades={comrades} bind:chatHistory bind:medias bind:muteAudio bind:muteVideo></Room>
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
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr);
		align-items: center;
		justify-content: center;
	}
	section {
		display: grid;
		align-items: center;
		justify-content: center;
		grid-template-rows: auto minmax(0, 1fr);
		padding: 1em;
	}
	section.roomReady {
		width: 100%;
		height: 100%;
		align-items: initial;
		justify-content: initial;
		padding: 0;
	}
	header {
		text-align: center;
		font-size: 200%;
		font-weight: 600;
		background: #111;
	}
	article {
		background: #111;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr);
		padding: .5em;
		max-width: 70ch;
	}
	article.roomReady {
		width: 100%;
		height: 100%;
		max-width: 100%;
		max-height: 100%;
		overflow: hidden;
	}
</style>
