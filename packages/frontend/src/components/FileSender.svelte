<script type='ts'>
  import { mkPeerSendAdvertise, mkPeerSendRequest, mkPeerSendReject,mkPeerSendResponse } from "@extero/common/dist/src/api"
  import type { PeerFile, PeerFileInfo } from "@extero/common/dist/src/api"
  import type { Comrade } from "../comrade"
  import { v4 } from 'uuid'
  import { Buffer } from 'buffer'

  import { fileStore, PendingSend } from '../stores/files'
  import { onMount } from "svelte"
  import { fileSave } from 'browser-fs-access'

  export let comrades: Comrade[]
  let recipients: string[] = []
  $: comradeRecipients = comrades.filter(v=>recipients.includes(v.peerID))

  $: filesInfo = $fileStore.assembling.map(v=>({
    name: v.name,
    size: v.data.length,
    type: v.type,
    uuid: v.uuid,
  })) as PeerFileInfo[]
  $: totalByteSize = filesInfo.reduce((p,v) => {
    return p + v.size
  }, 0)
  $: responseMessage = mkPeerSendResponse($fileStore.assembling)
  $: advertiseMessage = mkPeerSendAdvertise(filesInfo)

  function handleFilePickerClick() {
    let el = document.createElement('input')
    el.setAttribute('type', 'file')
    el.setAttribute('multiple', 'true')

    el.addEventListener('change', (ev: InputEvent) => {
      for (let file of el.files) {
        addFile(file)
      }
    })

    el.click()
  }
  function handleFilePickerDragOver(e: DragEvent) {
    e.preventDefault()
  }
  function handleFilePickerDrop(e: DragEvent) {
    e.preventDefault()

    if (e.dataTransfer.items) {
      for (let item of e.dataTransfer.items) {
        if (item.kind === 'file') {
          let file = item.getAsFile()
          addFile(file)
        }
      }
    }
  }
  async function addFile(file: File) {
    console.log(file)
    let arrayBuffer = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)
    fileStore.addAssembling({
      name: file.name,
      type: file.type,
      data: buffer,
      uuid: v4(),
    })
  }
  function removeFile(uuid: string) {
    fileStore.removeAssembling(uuid)
  }

  function changeRecipientStatus(peerID: string, ev: InputEvent) {
    let target = <HTMLInputElement>(ev.target)
    let checked = target.checked
    if (checked && !recipients.includes(peerID)) {
      recipients = [...recipients, peerID]
    } else if (!checked && recipients.includes(peerID)) {
      recipients = recipients.filter(v=>v===peerID)
    }
  }

  function clearSendFiles() {
    fileStore.clearAssembling()
  }
  function startSendFiles() {
    let sends: PendingSend[] = []
    for (let comrade of comradeRecipients) {
      let sent = false
      for (let file of $fileStore.assembling) {
        let pendingSend: PendingSend = {
          peerID: comrade.peerID,
          file,
          status: 'pending',
        }
        sends.push(pendingSend)
        sent = true
      }
      if (sent) {
        comrade.dataConnection.send(advertiseMessage)
      }
    }
    fileStore.addSending(sends)
  }
  function removeSendingFile(peer: string, uuid: string) {
    // TODO: Send a revoke message
    fileStore.removeSending(peer, uuid)
  }
  function revokeAllFiles() {
    // TODO: Send revoke messages to targets.
    $fileStore.sending = []
    fileStore.refresh()
  }
  function acceptFile(peer: string, uuid: string) {
    let comrade = comrades.find(v=>v.peerID===peer)
    if (!comrade) {
      fileStore.removeReceiving(peer, uuid)
      return
    }
    fileStore.updateReceivingStatus(peer, uuid, 'receiving')
    comrade.dataConnection.send(
      mkPeerSendRequest([uuid])
    )
  }
  function rejectFile(peer: string, uuid: string) {
    let comrade = comrades.find(v=>v.peerID===peer)
    if (!comrade) {
      fileStore.removeReceiving(peer, uuid)
      return
    }
    comrade.dataConnection.send(
      mkPeerSendReject([uuid])
    )
    fileStore.removeReceiving(peer, uuid)
  }
  function acceptAllFiles() {
    for (let recv of $fileStore.receiving) {
      let comrade = comrades.find(v=>v.peerID===recv.peerID)
      if (!comrade) {
        fileStore.removeReceiving(recv.peerID, recv.file.uuid)
        continue
      }
      if (recv.status !== 'pending') continue
      recv.status = 'receiving'
      comrade.dataConnection.send(
        mkPeerSendRequest([recv.file.uuid])
      )
    }
    fileStore.refresh()
  }
  function rejectAllFiles() {
    for (let recv of $fileStore.receiving) {
      let comrade = comrades.find(v=>v.peerID===recv.peerID)
      if (!comrade) {
        fileStore.removeReceiving(recv.peerID, recv.file.uuid)
        continue
      }
      if (recv.status !== 'pending') continue
      comrade.dataConnection.send(
        mkPeerSendReject([recv.file.uuid])
      )
    }
    $fileStore.receiving = $fileStore.receiving.filter(v=>v.status!=='pending')
    fileStore.refresh()
  }
  function clearAllFiles() {
    rejectAllFiles()
    $fileStore.receiving = []
    fileStore.refresh()
  }
  function clearFile(peer: string, uuid: string) {
    fileStore.removeReceiving(peer, uuid)
  }
  async function saveFile(peer: string, uuid: string) {
    let file = $fileStore.receiving.find(v=>v.peerID===peer&&v.file.uuid===uuid)
    if (!file) {
      console.error(new Error("no file exists to save"))
      return
    }
    if (!file.receivedFile) {
      console.error(new Error("no receivedFile to save"))
      return
    }
    let blob = new Blob([new Uint8Array(file.receivedFile.data)])
    try {
      await fileSave(blob, {
        fileName: file.receivedFile.name,
        id: 'extero',
      })
    } catch(err: any) {
      console.error(err)
    }
  }
  onMount(() => {
    recipients = comrades.map(v=>v.peerID)
  })
</script>

<main>
  <section class='files'>
    <section class='filesInfo'>
      <section class='filesInfo__assembling'>
        <section class='filePicker' on:click={handleFilePickerClick} on:drop={handleFilePickerDrop} ondragover={handleFilePickerDragOver}>
          <span>
            Drop or click here to select a file.
          </span>
          <span class='filePicker__dropper'></span>
        </section>
        <section class='filesInfo__assembling__meta'>
          <section class='filesInfo__assembling__content'>
            <header>Assembling</header>
            <section class='filesInfo__list'>
              {#each $fileStore.assembling as file}
                <div class='file'>
                  <span>{file.name}</span>
                  <span>{(file.data.length/1024/1024).toFixed(2)}MB</span>
                  <span>
                    <button on:click={()=>removeFile(file.uuid)}>remove</button>
                  </span>
                </div>
              {/each}
            </section>
            <section class='filesInfo__totals'>
              <span>
              </span>
            </section>
            <section class='toolbar'>
              <button on:click={clearSendFiles}>clear file(s)</button>
              <button on:click={startSendFiles}>offer file(s)</button>
            </section>
          </section>
          <section class='recipients'>
            <header>Recipients</header>
            <section class='recipients__list'>
              {#each comrades as comrade}
                <div>
                  <span>{comrade.name}</span>
                  <input type='checkbox' checked={recipients.includes(comrade.peerID)} on:change={(e)=>changeRecipientStatus(comrade.peerID, e)}>
                </div>
              {/each}
            </section>
          </section>
        </section>
      </section>
      <section class='filesInfo__sending'>
        <header>Sending</header>
        <section class='filesInfo__list'>
          {#each $fileStore.sending as send}
            <div class='file -send'>
              <span>{send.file.name}</span>
              <span>{(send.file.data.length/1024/1024).toFixed(2)}MB</span>
              <span> ➡ {comrades.find(v=>v.peerID===send.peerID)?.name}</span>
              <span>
                {#if send.status==='pending'}
                  <button on:click={()=>removeSendingFile(send.peerID, send.file.uuid)}>revoke</button>
                {:else if send.status==='sending'}
                  <span>...</span>
                  <button on:click={()=>removeSendingFile(send.peerID, send.file.uuid)}>clear</button>
                {:else if send.status==='sent'}
                  <button on:click={()=>removeSendingFile(send.peerID, send.file.uuid)}>clear</button>
                {/if}
              </span>
            </div>
          {/each}
        </section>
        <section class='toolbar'>
          <button on:click={revokeAllFiles}>revoke all</button>
        </section>
      </section>
      <section class='filesInfo__receiving'>
        <header>Received</header>
        <section class='filesInfo__list'>
          {#each $fileStore.receiving as recv}
            <div class='file -receive'>
              <span>{comrades.find(v=>v.peerID===recv.peerID)?.name} ➡ </span>
              <span>{recv.file.name}</span>
              <span>{(recv.file.size/1024/1024).toFixed(2)}MB</span>
              <span>
                {#if recv.status==='receiving'}
                  <span>...</span>
                  <button on:click={()=>clearFile(recv.peerID, recv.file.uuid)}>clear</button>
                {:else if recv.status==='received'}
                  <button on:click={()=>saveFile(recv.peerID, recv.file.uuid)}>save</button>
                  <button on:click={()=>clearFile(recv.peerID, recv.file.uuid)}>clear</button>
                {:else}
                  <button on:click={()=>acceptFile(recv.peerID, recv.file.uuid)}>accept</button>
                  <button on:click={()=>rejectFile(recv.peerID, recv.file.uuid)}>reject</button>
                {/if}
              </span>
            </div>
          {/each}
        </section>
        <section class='toolbar'>
          <button on:click={acceptAllFiles}>accept all</button>
          <button on:click={rejectAllFiles}>reject all</button>
          <button on:click={clearAllFiles}>clear all</button>
        </section>
      </section>
    </section>
  </section>
</main>

<style>
  main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .files {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto auto;
  }
  .filePicker {
    min-height: 8em;
  }
  .filePicker__dropper {
    font-size: 300%;
    color: rgb(64, 64, 64);
  }
  .filesInfo {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
  }
  .filesInfo__list {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    background: rgb(32, 32, 32);
    margin: .5em;
    padding: .5em;
  }
  .filesInfo__assembling {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    background: rgb(32, 32, 32);
    margin: .5em;
    padding: .5em;
  }
  .filesInfo__assembling__meta {
    display: grid;
    grid-template-columns: auto minmax(8em, 1fr);
  }
  .filesInfo__assembling__content {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto auto;
  }
  .filesInfo__sending {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    background: rgb(32, 32, 32);
    margin: .5em;
    padding: .5em;
  }
  .filesInfo__receiving {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    background: rgb(32, 32, 32);
    margin: .5em;
    padding: .5em;
  }
  .file {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
  }
  .file.-send {
    grid-template-columns: auto minmax(0, 1fr) auto auto;
  }
  .file.-receive {
    grid-template-columns: auto minmax(0, 1fr) auto auto;
  }
  .toolbar {
  }
  .recipients {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
  }
  .recipients__list {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
</style>