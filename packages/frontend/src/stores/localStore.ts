// localStore.ts
import { Subscriber, Unsubscriber, Updater, writable } from 'svelte/store'

export const tempStore: Record<string, any> = {}

export interface Store<T> {
    subscribe: (this: void, run: Subscriber<T>) => Unsubscriber
    set: (value: T) => void
    update: (this: void, updater: Updater<T>) => void
}

export const localStore = <T>(key: string, initial: T) => {
  const toString = (value: T) => JSON.stringify(value, null, 2)
  const toObj = JSON.parse

  if (!storeAvailable) {
    if (tempStore[key] === undefined) {
      tempStore[key] = toString(initial)
    }
  } else {
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, toString(initial))
    }
  }

  let saved: T

  if (!storeAvailable) {
    saved = toObj(tempStore[key])
  } else {
    saved = toObj(window.localStorage.getItem(key))
  }

  const { subscribe, set, update } = writable<T>(saved)

  return {
    subscribe,
    set: (value: T) => {
      if (!storeAvailable) {
        tempStore[key] = toString(value)
      } else {
        localStorage.setItem(key, toString(value))
      }
      return set(value)
    },
    update
  }
}

export let storeAvailable: boolean = false
export function enableStore(enabled: boolean) {
  storeAvailable = enabled
}