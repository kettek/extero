import type { MediaType } from '@extero/common/src/api'

export interface Media {
  mediaType: MediaType
  uuid: string
  stream: MediaStream
  device?: string
  width?: number
  height?: number
  framerate?: number
  facing?: 'user'|'environment'
  captureAudio?: boolean
}