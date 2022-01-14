import type { ChatHistory } from '@extero/common/dist/src/api'

import { get, writable } from 'svelte/store'

export type WindowReference = Record<string,boolean>

const { subscribe, set, update } = writable<WindowReference>({})

export const windowStore = {
  subscribe,
  set,
  update,
  refresh: () => {
    set(get(windowStore))
  },
  shown: (win:string): boolean => {
    let ws = get(windowStore)
    if (ws[win]) {
      return true
    }
    return false
  },
  show: (win: string) => {
    let ws = get(windowStore)
    ws[win] = true
    set(ws)
  },
  hide: (win: string) => {
    let ws = get(windowStore)
    delete ws[win]
    set(ws)
  },
}