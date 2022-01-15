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
    fileStore.update((fs: Files) => {
      fs.assembling.push(file)
      return fs
    })
  },
  removeAssembling: (uuid: string) => {
    fileStore.update((fs: Files) => {
      fs.assembling = fs.assembling.filter(v=>v.uuid!==uuid)
      return fs
    })
  },
  clearAssembling: () => {
    fileStore.update((fs: Files) => {
      fs.assembling = []
      return fs
    })
  },
  addSending: (sends: PendingSend[]) => {
    fileStore.update((fs: Files) => {
      for (let send of sends) {
        if (fs.sending.find(v=>v.file.uuid===send.file.uuid&&v.peerID===send.peerID)) return
        fs.sending.push(send)
      }
      return fs
    })
  },
  removeSending: (peerID: string, uuid: string) => {
    fileStore.update((fs: Files) => {
      fs.sending = fs.sending.filter(v=>v.file.uuid!==uuid||v.peerID!==peerID)
      return fs
    })
  },
  updateSendingStatus: (peerID: string, uuid: string, status: 'pending'|'sending'|'sent') => {
    fileStore.update((fs: Files) => {
      let send = fs.sending.find(v=>v.file.uuid===uuid&&v.peerID===peerID)
      if (send) {
        send.status = status
      }
      return fs
    })
  },
  clearSent: () => {
    fileStore.update((fs: Files) => {
      fs.sending = fs.sending.filter(v=>v.status!=='sent')
      return fs
    })
  },
  addReceiving: (recvs: PendingReceive[]) => {
    fileStore.update((fs: Files) => {
      for (let recv of recvs) {
        if (fs.receiving.find(v=>v.file.uuid===recv.file.uuid)) return
        fs.receiving.push(recv)
      }
      return fs
    })
  },
  removeReceiving: (peerID: string, uuid: string) => {
    fileStore.update((fs: Files) => {
      fs.receiving = fs.receiving.filter(v=>v.file.uuid!==uuid||v.peerID!==peerID)
      return fs
    })
  },
  updateReceivingStatus: (peerID: string, uuid: string, status: 'pending'|'receiving'|'received') => {
    fileStore.update((fs: Files) => {
      let recv = fs.receiving.find(v=>v.file.uuid===uuid&&v.peerID===peerID)
      if (recv) {
        recv.status = status
      }
      return fs
    })
  },
  clearReceived: () => {
    fileStore.update((fs: Files) => {
      fs.receiving = fs.receiving.filter(v=>v.status!=='received')
      return fs
    })
  },
  refresh: () => {
    set({...get(fileStore)})
  },
}