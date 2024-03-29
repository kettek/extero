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
  import type Peer from 'peerjs'

	// Storage
	import StorageInitializer from './components/StorageInitializer.svelte'
	import type { Store } from './stores/localStore'
	import type { UserI } from './types/user'

	import Window from './components/Window.svelte'
	import { windowStore } from './stores/windows'
	import Settings from './components/Settings.svelte'
	import { globalActions } from './shared/emitters/actions'
	import Button from './components/Button.svelte'

	let initErrors: Error[] = []

	let storageReady: boolean = false

	let websocket: WebSocket
	let room: string = ''
	let serverReady: boolean = false

	// TODO: Restore username from local storage.
	let userStorage: Store<UserI>
  let localPeer: Peer
	let nameReady: boolean = false

	let mediaReady: boolean = false
	let muteVideo: boolean = false
	let muteAudio: boolean = false

	let comrades: Comrade[]

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
		globalActions.hook()
	})
</script>

<main>
	{#if initErrors.length > 0}
		<section>
			<header class='title'>
				<span>Error</span>
			</header>
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
			<header class='title'>
				{#if !roomReady}
					<span>
						extero
					</span>
					<nav>
						<Button on:click={()=>windowStore.show('settings')} icon='settings'/>
					</nav>
				{/if}
			</header>
			<article class:roomReady>
				{#if !storageReady}
					<StorageInitializer bind:ready={storageReady}></StorageInitializer>
				{:else}
					<ServerConnector bind:websocket bind:localPeer bind:ready={serverReady} bind:room={room} bind:roomReady={roomReady} bind:userStorage bind:comrades></ServerConnector>
					{#if serverReady}
						{#if !nameReady}
							<NameChooser bind:storage={userStorage} bind:nameReady></NameChooser>
						{:else if !mediaReady}
							<MediaChooser bind:ready={mediaReady}></MediaChooser>
						{:else if !roomReady}
							<RoomChooser bind:room bind:roomReady></RoomChooser>
						{:else}
							<Room room={room} bind:userStorage comrades={comrades} bind:muteAudio bind:muteVideo bind:websocket></Room>
						{/if}
					{/if}
				{/if}
			</article>
		</section>
	{/if}
	{#if $windowStore['settings']}
		<Window>
			<Settings></Settings>
	  	<Button on:click={()=>{windowStore.hide('settings')}} icon='close'/>
		</Window>
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
	}
	section.roomReady {
		width: 100%;
		height: 100%;
		align-items: initial;
		justify-content: initial;
		padding: 0;
	}
	header {
		background: #111;
	}
	header.title {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
	}
	header.title span {
		text-align: center;
		font-size: 200%;
		font-weight: 600;
	}
	header.title button {
		border: 0;
		background: none;
		cursor: pointer;
	}
	article {
		background: #111;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr);
		padding: .5em;
	}
	article.roomReady {
		width: 100%;
		height: 100%;
		max-width: 100%;
		max-height: 100%;
		overflow: hidden;
		padding: 0;
	}
</style>
