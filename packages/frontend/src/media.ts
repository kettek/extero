import type { MediaType } from '@extero/common/src/api'

export interface Media {
  mediaType: MediaType
  uuid: string
  stream: MediaStream
}