"use strict"

function fix(value) {
    if (typeof value === "string") return JSON.stringify(value)
    if (typeof value === "number") return value
    if (typeof value === "boolean") return value
    if (typeof value === "function") return JSON.stringify(value.toString())
    if (typeof value === "symbol") return JSON.stringify(value.toString())
    if (value == null) return value
    if (value instanceof Error) return JSON.stringify(value.toString())
    return value
}

module.exports = (ev, done) => {
    const path = ev.path.map(x => `[${x.index}: ${x.name}]`).join(" > ")

    console.log(`${ev.type} ${path ? `${path} ` : ""}= ${fix(ev.value)}`)
    done()
}
