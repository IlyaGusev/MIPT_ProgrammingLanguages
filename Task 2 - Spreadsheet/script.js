class Parser {
    constructor(lexer) {
        this.lexer = lexer
    }

    parse() {
        this.lexer.next()
        let ret = this.expression()
        let cur = this.lexer.get()
        if (cur.type !== 'eof') {
            throw new Error(`Expected EOF at ${cur.tail}`)
        } else {
            return ret
        }
    }

    expression() {
        let negate = false
        let cur = this.lexer.get()
        if (cur.type === 'sub') {
            negate = true
            this.lexer.next()
        }
        let ret = this.term()
        if (negate) {
            if (typeof ret !== 'number') {
                throw new Error(`Unexpected type at ${cur.tail}: ${typeof ret}`)
            } else {
                ret = -ret
            }
        }
        cur = this.lexer.get()
        if (cur.type === 'add' || cur.type === 'sub') {
            if (typeof ret !== 'number') {
                throw new Error(`Unexpected type at ${cur.tail}: ${typeof ret}`)
            }
        }
        while (cur.type === 'add' || cur.type === 'sub') {
            this.lexer.next()
            let x = this.term()
            if (typeof x !== 'number') {
                throw new Error(`Unexpected type at ${cur.tail}: ${typeof x}`)
            }
            if (cur.type === 'add') {
                ret += x
            } else {
                ret -= x
            }
            cur = this.lexer.get()
        }
        return ret
    }

    term() {
        let ret = this.factor()
        let cur = this.lexer.get()
        if (cur.type === 'mul' || cur.type === 'div') {
            if (typeof ret !== 'number') {
                throw new Error(`Unexpected type at ${cur.tail}: ${typeof ret}`)
            }
        }
        while (cur.type === 'mul' || cur.type === 'div') {
            this.lexer.next()
            let x = this.factor()
            if (typeof x !== 'number') {
                throw new Error(`Unexpected type at ${cur.tail}: ${typeof x}`)
            }
            if (cur.type === 'mul') {
                ret *= x
            } else {
                if (x === 0) {
                    throw new Error(`Division by zero at ${cur.tail}`)
                }
                ret /= x
            }
            cur = this.lexer.get()
        }
        return ret
    }

    factor() {
        let cur = this.lexer.get()
        if (cur.type === 'number') {
            this.lexer.next()
            return cur.value
        } else if(cur.type === 'left') {
            this.lexer.next()
            let ret = this.expression()
            if (this.lexer.get().type !== 'right') {
                throw new Error(`Parentheses mismatch at ${this.lexer.get().tail}`)
            }
            this.lexer.next()
            return ret
        } else if(cur.type === 'identifier') {
            return this.reference()
        } else {
            throw new Error(`Expected either a number, a parenthesis or an identifier at ${cur.tail}`)
        }
    }

    reference() {
        const cur = this.lexer.get()
        this.lexer.next()
        if (this.lexer.get().type === 'left') {
            this.lexer.next()
            let ret = this.expression()
            if (this.lexer.get().type !== 'right') {
                throw new Error(`Parentheses mismatch at ${this.lexer.get().tail}`)
            }
            this.lexer.next()
            if (cur.value === 'ABS') {
                if (typeof ret !== 'number') {
                    throw new Error(`Unexpected type at ${cur.tail}: ${typeof ret}`)
                } else {
                    return Math.abs(ret)
                }
            } else if (cur.value === 'SIN') {
                if (typeof ret !== 'number') {
                    throw new Error(`Unexpected type at ${cur.tail}: ${typeof ret}`)
                } else {
                    return Math.sin(ret)
                }
            } else if (cur.value === 'LEN') {
                if (!['string', 'number'].includes(typeof ret)) {
                    throw new Error(`Unexpected type at ${cur.tail}: ${typeof ret}`)
                } else {
                    return String(ret).length
                }
            } else {
                throw new Error(`Unknown function name at ${cur.tail}: ${cur.value}`)
            }
        } else {
            if (!model.hasOwnProperty(cur.value)) {
                throw new Error(`Unknown cell name at ${cur.tail}: ${cur.value}`)
            } else if(model[cur.value].isActive()) {
                throw new Error(`Circular dependency: ${Object.keys(model).filter(key => model[key].isActive()).join(', ')}`)
            } else {
                const ret = model[cur.value].getResult()
                if (ret === undefined) {
                    throw new Error(`Dependent cell is erroneous: ${cur.value}`)
                } else {
                    return ret
                }
            }
        }
    }
}

class Cell {
    constructor(identifier, value) {
        this.identifier = identifier
        this.raw = value
        this.ret = null
        this.active = false
    }

    isActive() {
        return this.active
    }

    getIdentifier() {
        return this.identifier
    }

    getRawValue() {
        return this.raw
    }

    getResult() { 
        if (this.ret === null) {
            // If empty, will give undefined.
            if (this.raw[0] === '=') {
                try {
                    this.active = true
                    const lexer = new Lexer(this.raw.slice(1))
                    const parser = new Parser(lexer)
                    this.ret = parser.parse()
                } catch (error) {
                    errors.push(`${this.identifier}: ${error.message}`)
                    this.ret = undefined
                } finally {
                    this.active = false
                }
            } else if (isNumber(this.raw)) {
                this.ret = Number(this.raw)
            } else {
                this.ret = this.raw
            }
        } 
        return this.ret
    }

    getPrintable() {
        const ret = this.getResult()
        if (ret === undefined) {
            return this.raw
        } else {
            return ret
        }
    }

    invalidate() {
        this.ret = null
    }
}

const cols = range(toCode('A'), toCode('Z')).map(toChar)
const rows = range(1, 20).map(String)
const model = constructMapping(cols, rows, (identifier) => new Cell(identifier, localStorage.getItem(identifier) || ''))
const errors = []

const application = new Vue({
    el: '#application',
    data: {
        cols, rows, errors,
        view: constructMapping(cols, rows, (identifier) => model[identifier].getPrintable())
    },
    methods: {
        blur: function(identifier) {
            // Vue does not support setting `length`.
            errors.splice(0)
            model[identifier] = new Cell(identifier, this.view[identifier])
            for (let cell of Object.values(model)) {
                cell.invalidate()
            }
            for (let cell of Object.values(model)) {
                const x = cell.getIdentifier()
                this.$set(this.view, x, model[x].getPrintable())
                localStorage.setItem(x, model[x].getRawValue())
            }
        },
        focus: function(identifier) {
            this.$set(this.view, identifier, model[identifier].getRawValue())
        },
        reset: function() {
            localStorage.clear()
            location.reload()
        }
    }
})
