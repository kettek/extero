import type { DataConnection, MediaConnection } from 'peerjs'

export interface Comrade {
  name: string
  peerID: string
  mediaConnections: MediaConnection[]
  dataConnection: DataConnection
}