import type { ChatHistory } from '@extero/common/dist/src/api'

import { get, writable } from 'svelte/store'

const { subscribe, set, update } = writable<ChatHistory[]>([])

export const chatStore = {
  subscribe,
  set,
  update,
  push: (h: ChatHistory) => {
    let cs = get(chatStore)
    cs.push(h)
    set(cs)
  },
  refresh: () => {
    set(get(chatStore))
  },
}