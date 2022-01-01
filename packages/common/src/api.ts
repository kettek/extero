export interface HelloMessage {
  type: 'hello'
  peerID: string
}
export function isHelloMessage(o: any): o is HelloMessage {
  return o.type === 'hello'
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

export interface MemberJoinMessage {
  type: 'member-join'
  room: string
  peerID: string
}
export function isMemberJoinMessage(o: any): o is MemberJoinMessage {
  return o.type === 'member-join'
}

export interface MemberLeftMessage {
  type: 'member-left'
  room: string
  peerID: string
}
export function isMemberLeftMessage(o: any): o is MemberLeftMessage {
  return o.type === 'member-left'
}
