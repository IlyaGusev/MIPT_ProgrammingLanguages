class Lexer {
    constructor(string) {
        this.string = string
        this.pointer = 0
        this.lexem = null
    }

    static isDigit(char) {
        const code = toCode(char)
        return toCode('0') <= code && code <= toCode('9')
    }

    static isNumberish(char) {
        return Lexer.isDigit(char) || char === '.'
    }

    static isAlpha(char) {
        const code = toCode(char)
        return toCode('A') <= code && code <= toCode('Z')
    }

    static isAlphaNumeric(char) {
        return Lexer.isDigit(char) || Lexer.isAlpha(char)
    }

    get() {
        return this.lexem
    }

    next() {
        while (!this.done() && this.string[this.pointer] === ' ') {
            this.pointer += 1
        }
        if (this.done()) {
            this.lexem = { type: 'eof', tail: this.pointer }
        } else {
            let char = this.string[this.pointer]
            if (char === '(') {
                this.lexem = { type: 'left' }
            } else if (char === ')') {
                this.lexem = { type: 'right' }  
            } else if (char === '+') {
                this.lexem = { type: 'add' }
            } else if (char === '-') {
                this.lexem = { type: 'sub' }
            } else if (char === '/') {
                this.lexem = { type: 'div' }
            } else if (char === '*') {
                this.lexem = { type: 'mul' }
            } else if (Lexer.isDigit(char)) {
                let ret = char
                this.pointer += 1
                while (!this.done() && Lexer.isNumberish(this.string[this.pointer])) {
                    ret += this.string[this.pointer]
                    this.pointer += 1
                }
                this.pointer -= 1
                const n = Number(ret)
                if (isNaN(n)) {
                    throw new Error(`Could not convert to a number at ${this.pointer}: '${ret}'`)
                } else {
                    this.lexem = { type: 'number', value: n }
                }
            } else if (Lexer.isAlpha(char)) {
                let ret = char
                this.pointer += 1
                while (!this.done() && Lexer.isAlphaNumeric(this.string[this.pointer])) {
                    ret += this.string[this.pointer]
                    this.pointer += 1
                }
                this.pointer -= 1
                this.lexem = { type: 'identifier', value: ret }
            } else {
                throw new Error(`Unknown symbol at ${this.pointer}: '${char}'`)
            }
            this.lexem.tail = this.pointer
            this.pointer += 1
        }
    }

    done() {
        return this.pointer >= this.string.length
    }
}
