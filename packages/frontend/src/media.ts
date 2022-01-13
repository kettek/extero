import type { MediaType } from '@extero/common/src/api'

export interface Media {
  mediaType: MediaType
  uuid: string
  stream: MediaStream
  videoDevice?: string
  audioDevice?: string
  noiseSuppression?: boolean
  width?: number
  height?: number
  framerate?: number
  facing?: 'user'|'environment'
  captureAudio?: boolean
}