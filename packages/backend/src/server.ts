import express, { Request, Response } from 'express'
import WebSocket from 'ws'
import { ExpressPeerServer } from 'peer'
import http from 'http'
import https from 'https'
import fs from 'fs'
import { createRoom } from './Room'
import { isHelloMessage, isLeaveRoomMessage, isJoinRoomMessage, mkMemberJoinMessage, mkJoinRoomMessage, mkMemberLeftMessage, mkHelloMessage, mkMemberConnectionMessage } from '@extero/common/dist/src/api'
import { from as settingsFrom } from './settings'

(async () => {
	const settings = await settingsFrom()

	let server: https.Server | http.Server
	let roomServer: https.Server | http.Server
	const app = express()

	if (settings.https) {
		server = https.createServer({
			key: await fs.promises.readFile(settings.https.key),
			cert: await fs.promises.readFile(settings.https.cert),
		}, app).listen(settings.port, () => {
			return console.log(`securely listening on ${settings.port}`)
		})
	} else {
		server = http.createServer(app).listen(settings.port, () => {
			return console.log(`insecurely listening on ${settings.port}`)
		})
	}

	let rooms = []
	if (settings.https) {
		roomServer = https.createServer({
			key: await fs.promises.readFile(settings.https.key),
			cert: await fs.promises.readFile(settings.https.cert),
		}, (req, res) => {
		}).listen(settings.wsPort, () => {
			return console.log(`wss listening on ${settings.wsPort}`)
		})
	} else {
		roomServer = http.createServer((req, res) => {
		}).listen(settings.wsPort, () => {
			return console.log(`ws listening on ${settings.wsPort}`)
		})
	}

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
		if (room.members.find(v=>v.peerID===member.peerID)) {
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

	function memberUpdateConnection(member: any, roomName: string) {
		let roomIndex = rooms.findIndex(v=>v.name === roomName)
		if (roomIndex === -1) return
		let room = rooms[roomIndex]

		let msg = mkMemberConnectionMessage(roomName, member.peerID, member.mightBeLost?'purgatory':'alive')
		for (let m of room.members.filter(v=>v.peerID!==member.peerID)) {
			m.ws.send(JSON.stringify(msg))
		}
	}

	const wss = new WebSocket.Server({ server: roomServer })

	wss.on('connection', ws => {
		let member = {
			peerID: '',
			ws,
			room: '',
			lastPong: performance.now(),
			mightBeLost: true,
		}

		// Set up heartbeat to detect badly closed connections.
		ws.on('pong', () => {
			if (member.mightBeLost) {
				member.mightBeLost = false
				memberUpdateConnection(member, member.room)
			}
			member.lastPong = performance.now()
		})
		const hbInterval = setInterval(() => {
			let timeSinceLastPong = performance.now() - member.lastPong
			if (timeSinceLastPong >= 30000) { // Kick after 30 seconds.
			  return ws.terminate()
			}
			if (!member.mightBeLost && timeSinceLastPong >= 6000) { // Notify members of possible d/c after 6 seconds.
				member.mightBeLost = true
				memberUpdateConnection(member, member.room)
			}

			ws.ping()
		}, 3000)

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
			clearInterval(hbInterval)
			memberLeaveRoom(member, member.room)
		})
		ws.on('error', (err: any) => {
			console.error(err)
		})

		ws.send(JSON.stringify(
			mkHelloMessage()
		))
	})

	app.use('/', express.static('../frontend/public'))
	app.use('/peer', ExpressPeerServer(server, {}))

})()
