import type { Media } from '../media'

import { get, writable } from 'svelte/store'

const { subscribe, set, update } = writable<Media[]>([])

export const mediaStore = {
  subscribe,
  set,
  update,
  push: (m: Media) => {
    let ms = get(mediaStore)

    ms.push(m)

    set(ms)
  },
  remove: (uuid: string) => {
    set(get(mediaStore).filter(v=>v.uuid!==uuid))
  },
  refresh: () => {
    set(get(mediaStore))
  },
}