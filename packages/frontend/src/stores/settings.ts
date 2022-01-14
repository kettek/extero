import { localStore } from './localStore'

export interface SettingsI {
  soundEffectsEnabled: boolean
  soundEffectsVolume: number
}

export let settingsStore = localStore<SettingsI>('settings', {
  soundEffectsEnabled: true,
  soundEffectsVolume: 100,
})