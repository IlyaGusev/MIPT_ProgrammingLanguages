const EventEmitter = require('events')
const EmojisList = require('emojis-list')

const States = {
    RECRUITING: 0,
    PROGRESSING: 1,
    INACTIVE: 2
}

const CAPACITY = EmojisList.length
const TIMEOUT = 30 * 1000
const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [-1, 1]]
const WINNING_LENGTH = 5

class Game extends EventEmitter {
    constructor(identifier) {
        super()
        /** @type {number} */
        this.identifier = identifier
        /** @type {number} */
        this.state = States.RECRUITING
        /** @type {string} */
        this.admin = null
        /** @type {Array.<GameCommunicator>} */
        this.players = []
        /** @type {Map.<string, string>} */
        this.board = new Map()
        /** @type {Array} */
        this.moves = []
        /** @type {Map.<string, string>} */
        this.symbols = new Map()
        /** @type {string} */
        this.current = null
        /** @type {string} */
        this.winner = null
    }

    /**
     * Returns true if we could attach the player and false otherwise.
     * @param {GameCommunicator} communicator
     * @return {boolean}
     */
    attachPlayer(communicator) {
        if (this.state === States.RECRUITING) {
            if (this.players.length < CAPACITY) {
                if (this.players.length === 0) {
                    this.admin = communicator.getIdentifier()
                }
                this.players.push(communicator)
                const emojisPresent = new Set(...this.symbols.values())
                const emojisLeft = EmojisList.filter(emoji => !emojisPresent.has(emoji))
                this.symbols.set(communicator.getIdentifier(),
                    emojisLeft[Math.floor(Math.random() * emojisLeft.length)])
                this.players.forEach((player) => {
                    if (player.getIdentifier() !== communicator.getIdentifier()) {
                        player.updateParticipants()
                    }
                })
                return true
            }
        }
        return false
    }

    /** @returns {string} */
    getNextActorIdentifier_(index)  {
        return this.players[index + 1 === this.players.length
            ? 0 : index + 1].getIdentifier()
    }

    /** @returns {number} */
    getCurrentActorIndex_(identifier) {
        return this.players.findIndex((player) => player.getIdentifier() === identifier)
    }

    /** @param {GameCommunicator} */
    detachPlayer(communicator) {
        if (this.players.length === 1) {
            this.destruct_()
        } else {
            const index = this.getCurrentActorIndex_(communicator.getIdentifier())
            const nextActorIdentifier = this.getNextActorIdentifier_(index)
            if (this.admin === communicator.getIdentifier()) {
                if (this.players.length > 1) {
                    this.admin = nextActorIdentifier
                } else {
                    this.admin = null
                }
            }
            this.players.splice(index, 1)
            this.symbols.delete(communicator.getIdentifier())
            this.players.forEach((player) => {
                player.updateParticipants()
            })
            if (this.state === States.PROGRESSING) {
                if (this.current === communicator.getIdentifier()) {
                    this.current = nextActorIdentifier
                    this.expectNextMove_()
                }
            }
        }
    }

    destruct_() {
        clearTimeout(this.timeout)
        this.players.length = 0
        this.admin = null
        this.current = null
        this.state = States.INACTIVE
        this.emit('destruct', this.identifier)
    }

    expectNextMove_() {
        clearTimeout(this.timeout)
        this.players.forEach((player) => {
            player.updateGameState()
        })
        this.timeout = setTimeout(() => {
            this.current = this.getNextActorIdentifier_(
                this.getCurrentActorIndex_(this.current))
            this.expectNextMove_()
        }, TIMEOUT)
    }

    /** @returns {boolean} */
    isAdmin(communicator) {
        return this.admin === communicator.getIdentifier()
    }

    /** @returns {Object} */
    describeParticipants() {
        return this.players.map((player, index) => ({
            identifier: player.getIdentifier(),
            symbol: this.symbols.get(player.getIdentifier())
        }))
    }

    /** @returns {Map} */
    getBoard() {
        return this.board
    }

    /** @returns {number} */
    getIdentifier() {
        return this.identifier
    }

    /**
     * Returns true if we were able to start the game and false otherwise.
     * @param {GameCommunicator} communicator
     * @returns {boolean}
     */
    start(communicator) {
        if (this.state !== States.RECRUITING || !this.isAdmin(communicator)) {
            return false
        } else {
            this.state = States.PROGRESSING
            this.players.forEach((player) => {
                player.notifyStart()
            })
            this.current = this.players[0].getIdentifier()
            this.expectNextMove_()
            return true
        }
    }

    /**
     * Returns true if we were able to apply the move and false otherwise.
     * @param {GameCommunicator} communicator 
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    move(communicator, x, y) {
        if (this.state !== States.PROGRESSING) {
            return false
        }
        const identifier = communicator.getIdentifier()
        if (this.current !== identifier) {
            return false
        } else if (this.board.has(`${x}:${y}`)) {
            return false
        } else {
            const symbol = this.symbols.get(identifier)
            this.board.set(`${x}:${y}`, symbol)
            this.moves.push({ x, y })
            const inRow = (dx, dy) => {
                const key = `${x + dx}:${y + dy}`
                return this.board.has(key) && this.board.get(key) === symbol
            }
            let success = false
            for (let [dx, dy] of DIRECTIONS) {
                let count = 1
                for (let i = 1; inRow(i * dx, i * dy); ++i) {
                    count += 1
                }
                for (let i = -1; inRow(i * dx, i * dy); --i) {
                    count += 1
                }
                if (count >= WINNING_LENGTH) {
                    success = true
                    break
                }
            }
            if (success) {
                clearTimeout(this.timeout)
                this.state = States.INACTIVE
                this.winner = identifier
                this.players.forEach((player) => {
                    player.updateGameState()
                    if (success) {
                        player.notifyFinal()
                    }
                })
            } else {
                this.current = this.getNextActorIdentifier_(
                    this.getCurrentActorIndex_(this.current))
                this.expectNextMove_()
            }
            return true
        }
    }

    /** @return {string} */
    getActor() {
        return this.current
    }

    /** @return {number} */
    getTimeout() {
        return TIMEOUT
    }

    /** @return {string} */
    getWinner() {
        return this.winner
    }

    /** @return {Arrays.<Object>} */
    getMoves() {
        return this.moves
    }
}

class Manager {
    constructor() {
        this.counter = 0
        this.games = new Map()
    }

    create() {
        const game = new Game(this.counter)
        game.on('destruct', (identifier) => this.destruct_(identifier))
        this.games.set(game.getIdentifier(), game)
        this.counter += 1
        return game
    }

    get(identifier) {
        if (!this.games.has(identifier)) {
            return null
        } else {
            return this.games.get(identifier)
        }
    }

    destruct_(identifier) {
        this.games.delete(identifier)
    }
}

module.exports = new Manager()
