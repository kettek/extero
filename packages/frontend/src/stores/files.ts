import type { PeerFile, PeerFileInfo } from '@extero/common/dist/src/api'
import { get, writable } from 'svelte/store'

export interface PendingSend {
  peerID: string
  file: PeerFile
  status: 'pending' | 'sending' | 'sent'
}

export interface PendingReceive {
  peerID: string
  file: PeerFileInfo
  receivedFile?: PeerFile
  status: 'pending' | 'receiving' | 'received'
}

export interface Files {
  assembling: PeerFile[]
  sending: PendingSend[]
  receiving: PendingReceive[]
}

const { subscribe, set, update } = writable<Files>({
  assembling: [],
  sending: [],
  receiving: [],
})

export const fileStore = {
  subscribe,
  set,
  update,
  addAssembling: (file: PeerFile) => {
    let fs = get(fileStore)
    fs.assembling.push(file)
    set(fs)
  },
  removeAssembling: (uuid: string) => {
    let fs = get(fileStore)
    fs.assembling = fs.assembling.filter(v=>v.uuid!==uuid)
    set(fs)
  },
  clearAssembling: () => {
    let fs = get(fileStore)
    fs.assembling = []
    set(fs)
  },
  addSending: (send: PendingSend) => {
    let fs = get(fileStore)
    if (fs.sending.find(v=>v.file.uuid===send.file.uuid)) return
    fs.sending.push(send)
    set(fs)
  },
  removeSending: (peerID: string, uuid: string) => {
    let fs = get(fileStore)
    fs.sending = fs.sending.filter(v=>v.file.uuid!==uuid||v.peerID!==peerID)
    set(fs)
  },
  updateSendingStatus: (peerID: string, uuid: string, status: 'pending'|'sending'|'sent') => {
    let fs = get(fileStore)
    let send = fs.sending.find(v=>v.file.uuid===uuid&&v.peerID===peerID)
    if (send) {
      send.status = status
    }
    set(fs)
  },
  clearSent: () => {
    let fs = get(fileStore)
    fs.sending = fs.sending.filter(v=>v.status!=='sent')
    set(fs)
  },
  addReceiving: (recv: PendingReceive) => {
    let fs = get(fileStore)
    if (fs.receiving.find(v=>v.file.uuid===recv.file.uuid)) return
    fs.receiving.push(recv)
    set(fs)
  },
  removeReceiving: (peerID: string, uuid: string) => {
    let fs = get(fileStore)
    fs.receiving = fs.receiving.filter(v=>v.file.uuid!==uuid||v.peerID!==peerID)
    set(fs)
  },
  updateReceivingStatus: (peerID: string, uuid: string, status: 'pending'|'receiving'|'received') => {
    let fs = get(fileStore)
    let recv = fs.receiving.find(v=>v.file.uuid===uuid&&v.peerID===peerID)
    if (recv) {
      recv.status = status
    }
    set(fs)
  },
  clearReceived: () => {
    let fs = get(fileStore)
    fs.receiving = fs.receiving.filter(v=>v.status!=='received')
    set(fs)
  },
  refresh: () => {
    set({...get(fileStore)})
  },
}