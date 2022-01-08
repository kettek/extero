import type { DataConnection, MediaConnection } from 'peerjs'
  import type { MediaType } from '@extero/common/src/api'

export interface MediaReference {
  uuid: string
  mediaType: MediaType
  mediaConnection: MediaConnection
  stream: MediaStream
}


export interface Comrade {
  name: string
  peerID: string
  dataConnection: DataConnection
  outboundMedias: MediaReference[]
  inboundMedias: MediaReference[]
  volume: number
  color: string
}