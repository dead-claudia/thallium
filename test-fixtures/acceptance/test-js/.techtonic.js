"use strict"

const t = require("../../../index.js")

t.reporter((ev, done) => {
    if (ev.value instanceof Error) {
        ev.value = ev.value.toString()
    }

    console.log(JSON.stringify(ev))
})

module.exports = {techtonic: t}
