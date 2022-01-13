<script type='ts'>
  import { mkPeerSendAdvertise, mkPeerSendResponse } from "@extero/common/dist/src/api"
  import type { PeerFile, PeerFileInfo } from "@extero/common/dist/src/api"
  import type { Comrade } from "../comrade"
  import { v4 } from 'uuid'
  import { Buffer } from 'buffer'
  import { calculateObjectSize, serialize } from "bson"

  export let comrades: Comrade[]
  let recipients: string[] = []

  let files: PeerFile[] = []
  $: filesInfo = files.map(v=>({
    name: v.name,
    size: v.data.length,
    type: v.type,
    uuid: v.uuid,
  })) as PeerFileInfo[]
  $: totalByteSize = filesInfo.reduce((p,v) => {
    return p + v.size
  }, 0)
  $: responseMessage = mkPeerSendResponse(files)
  $: advertiseMessage = mkPeerSendAdvertise(filesInfo)
  $: totalMessageSize = calculateObjectSize(responseMessage)
  $: messageTooLarge = totalMessageSize >= 16*1024*1024

  function handleFilePickerClick() {
    let el = document.createElement('input')
    el.setAttribute('type', 'file')

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
    files = [
      ...files,
      {
        name: file.name,
        type: file.type,
        data: buffer,
        uuid: v4(),
      }
    ]
    //let msg =  mkPeerSendAdvertise()
  }
  function removeFile(index: number) {
    files = files.filter((_,i)=>index!==i)
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

  function sendFiles() {
    for (let comrade of comrades) {
      comrade.dataConnection.send(serialize(advertiseMessage))
    }
  }
</script>

<main>
  <section class='files'>
    <section class='filePicker' on:click={handleFilePickerClick} on:drop={handleFilePickerDrop} ondragover={handleFilePickerDragOver}>
      <span>
        Drop or click here to select a file.
      </span>
    </section>
    <section class='filesInfo'>
      <section class='filesInfo__list'>
        {#each files as file, fileIndex}
          <div class='file'>
            <span>{file.name}</span>
            <span>{(file.data.length/1024/1024).toFixed(2)}MB</span>
            <span>
              <button on:click={()=>removeFile(fileIndex)}>remove</button>
            </span>
          </div>
        {/each}
      </section>
      <section class='filesInfo__totals'>
        <span>
          Message Size: {(totalMessageSize/1024/1024).toFixed(2)}MB
        </span>
        {#if messageTooLarge}
          MESSAGE MUST BE {16}MB or less!
        {/if}
      </section>
    </section>
    <section class='toolbar'>
      <button disabled={messageTooLarge} on:click={sendFiles}>send file(s)</button>
    </section>
  </section>
  <section class='recipients'>
    {#each comrades as comrade}
      <div>
        <span>{comrade.name}</span>
        <input type='checkbox' checked={recipients.includes(comrade.peerID)} on:change={(e)=>changeRecipientStatus(comrade.peerID, e)}>
      </div>
    {/each}
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
  }
  .filesInfo {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
  }
  .filesInfo__list {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
  .file {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
  }
  .toolbar {
  }
  .recipients {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
</style>