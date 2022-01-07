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

/* Peer Messages */
export interface PeerMediaRequest {
  type: 'media-request'
  mediaType: 'primary' | 'secondary' | 'camera' | 'desktop' | 'window'
}
export function isPeerMediaRequest(o: any): o is PeerMediaRequest {
  return o.type === 'media-request'
}

export interface PeerChatMessage {
  type: 'chat'
  content: string // Optionally HTML formatted text.
}
export function isPeerChatMessage(o: any): o is PeerChatMessage {
  return o.type === 'chat'
}

export interface PeerNameMessage {
  type: 'name'
  name: string
}
export function isPeerNameMessage(o: any): o is PeerNameMessage {
  return o.type === 'name'
}