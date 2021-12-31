import express from 'express'
import { ExpressPeerServer } from 'peer'
import https from 'https'
import fs from 'fs'

const app = express()
const port = 3000

let httpsOptions = {
	key: fs.readFileSync( './localhost.key' ),
	cert: fs.readFileSync( './localhost.cert' ),
}

let server = https.createServer(httpsOptions, app).listen(port, () => {
	return console.log(`listening on ${port}`)
})

app.use('/', express.static('../frontend/public'))
app.use('/peer', ExpressPeerServer(server, {}))

