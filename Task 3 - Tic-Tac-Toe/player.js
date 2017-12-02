const EventEmitter = require('events')
const Communicators = require('./communicators')

class Player extends EventEmitter {
    constructor(ipAddress, timeStamp) {
        super()
        this.ipAddress = ipAddress
        this.timeStamp = timeStamp
        this.communicator = Communicators.forEntrance(this)
        this.on('read', (json) => this.read(json))
        this.on('destruct', () => this.destruct())
    }

    metamorph(communicator) {
        this.communicator = communicator
    }

    write(json) {
        this.emit('write', json)
    }

    /** @throws */
    read(json) {
        this.communicator.consume(json)
    }

    destruct() {
        this.communicator.detach()
    }

    getIdentifier() {
        return `${this.ipAddress}:${this.timeStamp}`
    }
}

module.exports = Player
