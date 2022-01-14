import { settingsStore } from './stores/settings'
import { get } from 'svelte/store'

export function playSound(src: string) {
  let ss = get(settingsStore)
  if (!ss.soundEffectsEnabled) return
  const sound = new Audio(`sounds/${src}.flac`)
  sound.volume = ss.soundEffectsVolume / 100
  sound.addEventListener('canplaythrough', async () => {
    await sound.play()
  })
}
