const assert = require('assert')
const Games = require('./games')

const string = (json, key) => {
    if (typeof json[key] !== 'string') {
        throw new Error(`Expected '${key}' to be a string`)
    } else {
        return json[key]
    }
}

const integer = (json, key) => {
    if (!Number.isSafeInteger(json[key])) {
        throw new Error(`Expected '${key}' to be a safe integer`)
    } else {
        return json[key]
    }
}

const contains = (value, options) => {
    if (!Array.isArray(options)) {
        options = [options]
    }
    if (!options.includes(value)) {
        throw new Error(`Expected '${value}' to be in [${options.join(', ')}]`)
    }
}

const representParticipants = (communicator, game) => ({
    type: 'game.participants',
    isAdmin: game.isAdmin(communicator),
    identifier: communicator.getIdentifier(),
    players: game.describeParticipants().map((description) => ({
        identifier: description.identifier,
        symbol: description.symbol
    })),
})

const mapToObject = (map) => {
    const ret = {}
    for (let [key, value] of map) {
        ret[key] = value
    }
    return ret
}

const representGameState = (game) => ({
    type: 'game.state',
    actor: game.getActor(),
    board: mapToObject(game.getBoard()),
    timeout: game.getTimeout(),
    moves: game.getMoves()
})

const representError = (error) => ({ error })

class Communicator {
    constructor(player) {
        this.player = player
    }

    getIdentifier() {
        return this.player.getIdentifier()
    }
}

class EntranceCommunicator extends Communicator {
    constructor(player) {
        super(player)
    }

    /** @throws */
    consume(json) {
        const type = string(json, 'type')
        contains(type, ['entrance.join', 'entrance.create'])
        if (type === 'entrance.join') {
            const game = Games.get(integer(json, 'game'))
            const next = Communicators.forGame(this.player, game)
            if (game !== null && game.attachPlayer(next)) {
                this.player.write({ type: 'entrance.ok' })
                this.player.write(representParticipants(this, game))
                this.player.metamorph(next)
            } else {
                this.player.write(representError('Could not join the game'))
            }
        } else if (type === 'entrance.create') {
            const game = Games.create()
            const next = Communicators.forGame(this.player, game)
            assert(game.attachPlayer(next))
            this.player.write({ type: 'entrance.ok', game: game.getIdentifier() })
            this.player.write(representParticipants(this, game))
            this.player.metamorph(next)
        }
    }

    detach() {
        // Do nothing.
    }
}

class GameCommunicator extends Communicator {
    constructor(player, game) {
        super(player)
        this.game = game
    }

    /** @throws */
    consume(json) {
        const type = string(json, 'type')
        contains(type, ['game.start', 'game.move'])
        if (type === 'game.start') {
            if (!this.game.start(this)) {
                this.player.write(representError('Could not start the game'))
            }
        } else if (type === 'game.move') {
            const x = integer(json, 'x')
            const y = integer(json, 'y')
            if (!this.game.move(this, x, y)) {
                this.player.write(representError('Invalid move'))
            }
        }
    }

    notifyStart() {
        this.player.write({ type: 'game.start' })
    }

    notifyFinal() {
        this.player.write({ type: 'game.final', winner: this.game.getWinner() })
        this.player.metamorph(Communicators.forEntrance(this.player))
    }

    updateParticipants() {
        this.player.write(representParticipants(this, this.game))
    }

    updateGameState() {
        this.player.write(representGameState(this.game))
    }

    detach() {
        this.game.detachPlayer(this)
    }
}

class Communicators {
    static forEntrance(player) {
        return new EntranceCommunicator(player)
    }

    static forGame(player, game) {
        return new GameCommunicator(player, game)
    }
}

module.exports = Communicators
