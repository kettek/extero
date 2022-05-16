export interface HelloMessage {
  type: 'hello'
  peerID: string
}
export function isHelloMessage(o: any): o is HelloMessage {
  return o.type === 'hello'
}
export function mkHelloMessage(peerID?: string): HelloMessage {
  return {
    type: 'hello',
    peerID
  }
}

export interface JoinRoomMessage {
  type: 'join-room'
  room: string
  members: string[]
  success: boolean
}
export function isJoinRoomMessage(o: any): o is JoinRoomMessage {
  return o.type === 'join-room'
}
export function mkJoinRoomMessage(room: string, members?: string[], success?: boolean): JoinRoomMessage {
  return {
    type: 'join-room',
    room,
    members,
    success
  }
}

export interface LeaveRoomMessage {
  type: 'leave-room'
  room: string
}
export function isLeaveRoomMessage(o: any): o is LeaveRoomMessage {
  return o.type === 'leave-room'
}
export function mkLeaveRoomMessage(room: string): LeaveRoomMessage {
  return {
    type: 'leave-room',
    room,
  }
}

export interface MemberJoinMessage {
  type: 'member-join'
  room: string
  peerID: string
}
export function isMemberJoinMessage(o: any): o is MemberJoinMessage {
  return o.type === 'member-join'
}
export function mkMemberJoinMessage(room: string, peerID: string): MemberJoinMessage {
  return {
    type: 'member-join',
    room,
    peerID,
  }
}

export interface MemberLeftMessage {
  type: 'member-left'
  room: string
  peerID: string
}
export function isMemberLeftMessage(o: any): o is MemberLeftMessage {
  return o.type === 'member-left'
}
export function mkMemberLeftMessage(room: string, peerID: string): MemberLeftMessage {
  return {
    type: 'member-left',
    room,
    peerID,
  }
}

export interface MemberConnectionMessage {
  type: 'member-connection'
  room: string
  peerID: string
  state: 'alive' | 'purgatory'
}
export function isMemberConnectionMessage(o: any): o is MemberConnectionMessage {
  return o.type === 'member-connection'
}
export function mkMemberConnectionMessage(room: string, peerID: string, state: 'alive'|'purgatory'): MemberConnectionMessage {
  return {
    type: 'member-connection',
    room,
    peerID,
    state,
  }
}

export type MediaType = 'unknown' | 'camera' | 'capture'

/* Peer Messages */
export interface PeerMediaRequest {
  type: 'media-request'
  uuid: string
}
export function isPeerMediaRequest(o: any): o is PeerMediaRequest {
  return o.type === 'media-request'
}
export function mkPeerMediaRequest(uuid: string): PeerMediaRequest {
  return {
    type: 'media-request',
    uuid,
  }
}

export interface PeerMediaAdvertise {
  type: 'media-advertise'
  mediaType: MediaType
  uuid: string
}
export function isPeerMediaAdvertise(o: any): o is PeerMediaAdvertise {
  return o.type === 'media-advertise'
}
export function mkPeerMediaAdvertise(mediaType: MediaType, uuid: string): PeerMediaAdvertise {
  return {
    type: 'media-advertise',
    mediaType,
    uuid,
  }
}

export interface PeerChatMessage {
  type: 'chat'
  content: string // Optionally HTML formatted text.
}
export function isPeerChatMessage(o: any): o is PeerChatMessage {
  return o.type === 'chat'
}
export function mkPeerChatMessage(content: string): PeerChatMessage {
  return {
    type: 'chat',
    content,
  }
}

export interface PeerNameMessage {
  type: 'name'
  name: string
}
export function isPeerNameMessage(o: any): o is PeerNameMessage {
  return o.type === 'name'
}
export function mkPeerNameMessage(name: string): PeerNameMessage {
  return {
    type: 'name',
    name,
  }
}

export interface PeerColorMessage {
  type: 'color'
  color: string
}
export function isPeerColorMessage(o: any): o is PeerColorMessage {
  return o.type === 'color'
}
export function mkPeerColorMessage(color: string): PeerColorMessage {
  return {
    type: 'color',
    color,
  }
}

export interface PeerImageMessage {
  type: 'image'
  image: string
}
export function isPeerImageMessage(o: any): o is PeerImageMessage {
  return o.type === 'image'
}
export function mkPeerImageMessage(image: string): PeerImageMessage {
  return {
    type: 'image',
    image,
  }
}

export interface PeerMediaState {
  type: 'media-state'
  uuid: string
  mutedVideo: boolean
  mutedAudio: boolean
}
export function isPeerMediaStateMessage(o: any): o is PeerMediaState {
  return o.type === 'media-state'
}
export function mkPeerMediaStateMessage(uuid: string, mutedVideo: boolean, mutedAudio: boolean): PeerMediaState {
  return {
    type: 'media-state',
    uuid,
    mutedVideo,
    mutedAudio,
  }
}

// File Send/Receive
export interface PeerFileInfo {
  name: string
  size: number
  type: string
  uuid: string
}

export interface PeerFile {
  name: string
  data: Buffer
  type: string
  uuid: string
}

export interface PeerSendAdvertise {
  type: 'send-advertise'
  files: PeerFileInfo[]
}
export function isPeerSendAdvertise(o: any): o is PeerSendAdvertise {
  return o.type === 'send-advertise'
}
export function mkPeerSendAdvertise(files: PeerFileInfo[]): PeerSendAdvertise {
  return {
    type: 'send-advertise',
    files,
  }
}

export interface PeerSendRequest {
  type: 'send-request'
  uuids: string[]
}
export function isPeerSendRequest(o: any): o is PeerSendRequest {
  return o.type === 'send-request'
}
export function mkPeerSendRequest(uuids: string[]): PeerSendRequest {
  return {
    type: 'send-request',
    uuids,
  }
}

export interface PeerSendReject {
  type: 'send-reject'
  uuids: string[]
}
export function isPeerSendReject(o: any): o is PeerSendReject {
  return o.type === 'send-reject'
}
export function mkPeerSendReject(uuids: string[]): PeerSendReject {
  return {
    type: 'send-reject',
    uuids,
  }
}

export interface PeerSendResponse {
  type: 'send-response'
  files: PeerFile[]
}
export function isPeerSendResponse(o: any): o is PeerSendResponse {
  return o.type === 'send-response'
}
export function mkPeerSendResponse(files: PeerFile[]): PeerSendResponse {
  return {
    type: 'send-response',
    files,
  }
}

export interface PeerSendReceive {
  type: 'send-receive'
  uuids: string[]
}
export function isPeerSendReceive(o: any): o is PeerSendReceive {
  return o.type === 'send-receive'
}
export function mkPeerSendReceive(uuids: string[]): PeerSendReceive {
  return {
    type: 'send-receive',
    uuids,
  }
}

export interface ChatHistory {
  /** Record of the sender of the chat message */
  from: string
  /** Unprocessed chat content */
  content: string
  /** Timestamp when the message was received */
  timestamp: Date
  to?: string
  /** Markdown->HTML processed version of the content. */
  renderedContent?: string
}