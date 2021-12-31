import express, { Request, Response } from 'express'
import WebSocket from 'ws'
import { ExpressPeerServer } from 'peer'
import https from 'https'
import fs from 'fs'

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
	ws.send(JSON.stringify({
		type: 'hello'
	}))
})
wss.on('message', msg => {
	console.log('msg', msg)
})

app.use('/', express.static('../frontend/public'))
app.use('/peer', ExpressPeerServer(server, {}))
