import express, { Request, Response } from 'express'
import WebSocket from 'ws'
import { ExpressPeerServer } from 'peer'
import https from 'https'
import fs from 'fs'
import { createRoom } from './Room'
import { isHelloMessage, isLeaveRoomMessage, isJoinRoomMessage, mkMemberJoinMessage, mkJoinRoomMessage, mkMemberLeftMessage, mkHelloMessage } from '@extero/common/dist/src/api'

const app = express()
const port = 3000
const wsPort = 3001

let httpsOptions = {
	key: fs.readFileSync( './localhost.key' ),
	cert: fs.readFileSync( './localhost.cert' ),
}

let server = https.createServer(httpsOptions, app).listen(port, () => {
	return console.log(`listening on ${port}`)
})

let rooms = []
let roomServer = https.createServer(httpsOptions, (req, res) => {
	console.log('argh')
}).listen(wsPort, () => {
	return console.log(`ws listening on ${wsPort}`)
})

function memberJoinRoom(member: any, roomName: string) {
	// TODO: Allow password locking.
	let room = rooms.find(v=>v.name === roomName)
	let isNewRoom = false
	if (!room) {
		// Create room
		rooms.push(createRoom(roomName))
		room = rooms[rooms.length-1]
		isNewRoom = true
	}
	if (room.members.find(v=>v===member)) {
		console.log('member tried to join more than once')
		return
	}
	room.members.push(member)
	member.room = room.name
	// Send join-room response with members, excluding the peer itself.
	member.ws.send(JSON.stringify(
		mkJoinRoomMessage(room.name, room.members.map(v=>v.peerID).filter(v=>v !== member.peerID), true)
	))
	// Send member-join for existing rooms.
	if (!isNewRoom) {
		for (let m of room.members.filter(v=>v.peerID!==member.peerID)) {
			m.ws.send(JSON.stringify(
				mkMemberJoinMessage(room.name, member.peerID)
			))
		}
	}
}

function memberLeaveRoom(member: any, roomName: string) {
	console.log('member left')
	let roomIndex = rooms.findIndex(v=>v.name === roomName)
	if (roomIndex === -1) return
	let room = rooms[roomIndex]
	let memberIndex = room.members.findIndex(v=>v.peerID === member.peerID)
	if (memberIndex === -1) return
	room.members.splice(memberIndex, 1)
	// Delete if it is empty
	if (room.members.length === 0) {
		rooms.splice(roomIndex, 1)
	} else {
		// Otherwise let existing members know member left.
		for (let m of room.members) {
			m.ws.send(JSON.stringify(
				mkMemberLeftMessage(room.name, member.peerID)
			))
		}
	}
	// Also let the member know that we know they left.
	member.ws.send(JSON.stringify(
		mkMemberLeftMessage(room.name, member.peerID)
	))
}

const wss = new WebSocket.Server({ server: roomServer })

wss.on('connection', ws => {
	let member = {
		peerID: '',
		ws,
		room: '',
	}
	ws.on('message', (data: WebSocket.Data) => {
		let msg = JSON.parse(data.toString())
		if (isHelloMessage(msg)) {
			if (!msg.peerID) {
				// TODO: Bad command to send hello without a peerID
				ws.close()
				return
			}
			// Only accept the peerID _once_
			if (!member.peerID) {
				member.peerID = msg.peerID
			}
		} else if (isJoinRoomMessage(msg)) {
			memberJoinRoom(member, msg.room)
		} else if (isLeaveRoomMessage(msg)) {
			memberLeaveRoom(member, msg.room)
		}
	})
	ws.on('close', () => {
		memberLeaveRoom(member, member.room)
	})

	ws.send(JSON.stringify(
		mkHelloMessage()
	))
})

app.use('/', express.static('../frontend/public'))
app.use('/peer', ExpressPeerServer(server, {}))
