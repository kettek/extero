import express, { Request, Response } from 'express'
import WebSocket from 'ws'
import { ExpressPeerServer } from 'peer'
import https from 'https'
import fs from 'fs'
import { createRoom } from './Room'
import { isHelloMessage, isLeaveRoomMessage, isJoinRoomMessage, mkMemberJoinMessage, mkJoinRoomMessage, mkMemberLeftMessage, mkHelloMessage } from '@extero/common/src/api'

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

function memberLeaveRoom(member: any, room: string) {
	let roomIndex = rooms.findIndex(v=>v.name === room)
	if (roomIndex === -1) return
	let memberIndex = rooms[roomIndex].members.findIndex(v=>v.peerID === member.peerID)
	if (memberIndex === -1) return
	rooms[roomIndex].members.splice(memberIndex, 1)
	// Delete if it is empty
	if (rooms[roomIndex].members.length === 0) {
		rooms.splice(roomIndex, 1)
	} else {
		// Otherwise let existing members know member left.
		for (let m of rooms[roomIndex].members) {
			m.ws.send(JSON.stringify(
				mkMemberLeftMessage(rooms[roomIndex].name, member.peerID)
			))
		}
	}
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
		console.log('got', msg)
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
