class Client {
    constructor() {
        this.socket = new WebSocket(`ws://${location.host}`)
        this.listener = null
        this.socket.onmessage = (message) => this.read(message.data)
        this.queue = []
        this.socket.onopen = () => this.queue.forEach(item => this.write(item))
    }

    setListener(listener) {
        this.listener = listener
    }

    read(data) {
        const json = JSON.parse(data)
        console.log(json)
        if (this.listener !== null) {
            this.listener(json)
        }
    }

    write(data) {
        if (this.socket.readyState === this.socket.CONNECTING) {
            this.queue.push(data)
        } else {
            this.socket.send(JSON.stringify(data))
        }
    }
}
const client = new Client()

const States = {
    DECKHOUSE: 0,
    TRANSITING: 1,
    RECRUITING: 2,
    PLAYING: 3,
    CHILLING: 4
}
let state = -1

const Deckhouse = {
    template: '#deckhouse',
    mounted: function() {
        state = States.DECKHOUSE
        client.setListener((json) => {
            if (json.type === 'entrance.ok') {
                state = States.TRANSITING
                router.push(`/game/${json.game}`)
            }
        })
    },
    beforeDestroy: function() {
        client.setListener(null)
    },
    methods: {
        play: function() {
            client.write({ type: 'entrance.create' })
        }
    }
}

const L = 50
class CanvasController {
    constructor() {
        this.canvas = null
        this.centerX = 0
        this.centerY = 0
        this.fire = false
        this.board = {}
        this.focus = null
        const binding = this.draw.bind(this)
        this.draw = () => requestAnimationFrame(binding)
    }

    move(dx, dy) {
        this.centerX += dx
        this.centerY += dy
    }

    setCanvas(canvas) {
        this.canvas = canvas
        if (this.fire) {
            this.draw()
        }
    }

    setBoard(board) {
        this.board = board
    }

    getCell(x, y) {
        const worldX = this.centerX - this.canvas.width / 2 + x
        const worldY = this.centerY - this.canvas.height / 2 + y
        const cellX = Math.ceil((worldX - L / 2) / L)
        const cellY = Math.ceil((worldY - L / 2) / L)
        return { x: cellX, y: cellY }
    }

    getPoint(x, y) {
        return { x: x * L, y: y * L }
    }

    draw() {
        if (this.canvas === null) {
            this.fire = true
        } else {
            const context = this.canvas.getContext('2d')
            context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            const leftX = this.centerX - this.canvas.width / 2
            const topY = this.centerY - this.canvas.height / 2
            const rightMost = Math.floor((this.centerX + this.canvas.width / 2 - L / 2) / L)
            const leftMost = Math.ceil((leftX - L / 2) / L)
            const topMost = Math.ceil((topY - L / 2) / L)
            const bottomMost = Math.floor((this.centerY + this.canvas.height / 2 - L / 2) / L)
            for (let i = leftMost; i <= rightMost; ++i) {
                context.beginPath()
                const x = L / 2 + L * i - leftX
                context.moveTo(x, 0)
                context.lineTo(x, this.canvas.height)
                context.stroke()
            }
            for (let i = topMost; i <= bottomMost; ++i) {
                context.beginPath()
                const y = L / 2 + L * i - topY
                context.moveTo(0, y)
                context.lineTo(this.canvas.width, y)
                context.stroke()
            }
            if (this.focus !== null) {
                const focus = this.getPoint(this.focus.x, this.focus.y) 
                context.fillStyle = '#C8E6C9'
                context.fillRect(focus.x - leftX - L / 2 + 1, focus.y - topY - L / 2 + 1, L - 2, L - 2)
            }
            context.fillStyle = '#000'
            context.font = '20px Roboto'
            for (let cell of Object.keys(this.board)) {
                const [cellX, cellY] = cell.split(':').map(Number)
                const point = this.getPoint(cellX, cellY)
                context.fillText(this.board[cell], point.x - leftX - L / 4, point.y - topY + L / 8)
            }
            this.fire = false
        }
    }

    setFocus({ x, y }) {
        const point = this.getPoint(x, y)
        this.centerX = point.x
        this.centerY = point.y
        this.focus = { x, y }
    }
}

const Game = {
    template: '#game',
    data: function() {
        return {
            showBoard: false,
            isAdmin: false,
            userId: null,
            players: [],
            actor: null,
            time: '\u221E',
            moves: [],
            winner: null
        }
    },
    mounted: function() {
        this.interval = null
        this.lastX = NaN
        this.lastY = NaN
        this.initialX = NaN
        this.initialY = NaN
        // INVALID = -1, SQUEEZED = 0, DRAGGED = 1
        this.drag = -1
        canvasController = new CanvasController()
        client.setListener((json) => {
            if (json.error === 'Could not join the game') {
                router.push('/')
            } else if (json.type === 'game.participants') {
                this.isAdmin = json.isAdmin
                this.userId = json.identifier
                this.players = json.players
            } else if (json.type === 'game.start') {
                this.showBoard = true
                // Canvas will be instantiated in the next frame.
                setTimeout(() => {
                    canvasController.setCanvas(this.$refs.canvas)
                    canvasController.draw()
                })
                state = States.PLAYING
            } else if (json.type === 'game.state') {
                this.actor = json.actor
                this.moves = json.moves
                canvasController.setBoard(json.board)
                canvasController.draw()
                this.time = json.timeout / 1000
                clearInterval(this.interval)
                this.interval = setInterval(() => this.time -= 1, 1000)
            } else if (json.type === 'game.final') {
                clearInterval(this.interval)
                this.time = '\u221E'
                this.winner = json.winner
                this.actor = null
                state = States.CHILLING
            }
        })
        if (state !== States.TRANSITING) {
            client.write({ type: 'entrance.join', game: Number(this.$route.params.game) })
        }
        state = States.RECRUITING
    },
    beforeDestroy: function() {
        canvasController = null
        client.setListener(null)
    },
    methods: {
        canvasSqueeze: function(event) {
            if (this.drag === -1) {
                this.lastX = event.pageX
                this.lastY = event.pageY
                this.drag = 0
            } else {
                this.$refs.canvas.style.cursor = ''
                this.drag = -1
            }
        },
        canvasRelease: function(event) {
            if (this.drag === 0 && state === States.PLAYING && this.actor === this.userId) {
                const canvas = this.$refs.canvas
                const position = canvasController.getCell(
                    event.pageX - canvas.offsetLeft, event.pageY - canvas.offsetTop)
                client.write({ type: 'game.move', x: position.x, y: position.y })
            }
            this.$refs.canvas.style.cursor = ''
            this.drag = -1
        },
        canvasMotion: function(event) {
            const deltaX = this.lastX - event.pageX
            const deltaY = this.lastY - event.pageY
            if (this.drag >= 0 && (deltaX !== 0 || deltaY !== 0)) {
                this.drag = 1
                this.$refs.canvas.style.cursor = 'move'
                canvasController.move(deltaX, deltaY)
                this.lastX = event.pageX
                this.lastY = event.pageY
                canvasController.draw()
            }
        },
        start: function() {
            client.write({ type: 'game.start' })
        },
        focus: function(index) {
            canvasController.setFocus(this.moves[index])
            canvasController.draw()
        },
        home: function() {
            router.push('/')
        }
    }
}

const router = new VueRouter({
    mode: 'history',
    routes: [
        { path: '/', component: Deckhouse },
        { path: '/game/:game', component: Game }
    ]
})

const application = new Vue({
    el: '#application',
    router: router
})
