const ws = require('ws')
const http = require('http')
const express = require('express')
const fallback = require('express-history-api-fallback')
const Player = require('./player')

const application = express()
const root = 'frontend'
application.use(express.static(root))
application.use(fallback('index.html', { root }))
const server = http.createServer(application)
const wss = new ws.Server({ server })

wss.on('connection', (socket, request) => {
    let player = new Player(request.connection.remoteAddress, Date.now())
    socket.on('message', (string) => {
        try {
            player.emit('read', JSON.parse(string))
        } catch (exception) {
            console.warn(player.getIdentifier(), exception)
        }
    })
    player.on('write', (json) => {
        socket.send(JSON.stringify(json))
    })
    socket.on('close', () => {
        player.emit('destruct')
        // Remove the reference to enable garbage collection.
        player = null
    })

    let pong = true
    const waitPing = () => {
        setTimeout(() => syncPing(), 30 * 1000)
    }
    const syncPing = () => {
        if (player !== null) {
            if (!pong) {
                socket.terminate()
            } else {
                pong = false
                socket.ping()
                waitPing()
            }
        }
    }
    socket.on('pong', () => pong = true)
    waitPing()
})

server.listen(80, () => {
    console.log('Operating...')
})
