import express, { Request, Response } from 'express'
import WebSocket from 'ws'
import { ExpressPeerServer } from 'peer'
import https from 'https'
import fs from 'fs'
import { createRoom } from './Room'

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
		if (msg.type === 'hello') {
			if (!member.peerID) {
				member.peerID = msg.peerID
			}
		} else if (msg.type === 'join-room') {
			// TODO: Allow password locking.
			let room = rooms.find(v=>v.name===msg.room)
			let isNewRoom = false
			if (!room) {
				// Create room
				rooms.push(createRoom(msg.room))
				room = rooms[rooms.length-1]
				isNewRoom = true
			}
			room.members.push(member)
			member.room = room.name
			// Send join-room response with members, excluding the peer itself.
			ws.send(JSON.stringify({
				type: 'join-room',
				room: room.name,
				success: true,
				members: room.members.filter(v=>v.peerID !== member.peerID)
			}))
			// Send member-join for existing rooms.
			if (!isNewRoom) {
				for (let m of room.members.filter(v=>v.peerID!==member.peerID)) {
					m.ws.send(JSON.stringify({
						type: 'member-join',
						room: room.name,
						peerID: member.peerID
					}))
				}
			}
		}
	})
	ws.on('close', () => {
		let roomIndex = rooms.findIndex(v=>v.name === member.room)
		if (roomIndex >= 0) {
			rooms[roomIndex].members = rooms[roomIndex].members.filter(v=>v.peerID !== member.peerID)
			// Delete if it is empty
			if (rooms[roomIndex].members.length === 0) {
				rooms.splice(roomIndex, 1)
			} else {
				// Otherwise let existing members know member left.
				for (let m of rooms[roomIndex].members) {
					m.ws.send(JSON.stringify({
						type: 'member-left',
						room: rooms[roomIndex].name,
						peerID: member.peerID,
					}))
				}
			}
		}
	})

	ws.send(JSON.stringify({
		type: 'hello'
	}))
})

app.use('/', express.static('../frontend/public'))
app.use('/peer', ExpressPeerServer(server, {}))
