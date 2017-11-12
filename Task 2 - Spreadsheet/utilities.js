const range = (firstInclusive, lastInclusive) => {
    const ret = []
    for(let iter = firstInclusive; iter <= lastInclusive; ++iter) {
        ret.push(iter)
    }
    return ret
}

const toChar = (code) => String.fromCharCode(code)
const toCode = (char) => char.charCodeAt(0)

const constructMapping = (left, right, constructor) => {
    let ret = {}
    for (let x of left) {
        for (let y of right) {
            ret[x + y] = constructor(x + y)
        }
    }
    return ret
}

const isNumber = (string) => !isNaN(parseFloat(string)) && isFinite(string)
