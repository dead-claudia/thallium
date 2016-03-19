import Promise from "bluebird"
import {isThenable} from "../util/util.js"

export function activeReporters(ctx) {
    while (ctx.reporters == null) {
        ctx = ctx.parent
    }
    return ctx.reporters
}

// This is uncached, so reporters can expect a new object each time.
function getPath(ctx) {
    const ret = []

    while (!ctx.isBase) {
        ret.unshift({
            name: ctx.name,
            index: ctx.index,
        })
        ctx = ctx.parent
    }

    return ret
}

function maybePromisify(func, value) {
    return new Promise((resolve, reject) => {
        const res = func(value, err => {
            if (err != null) {
                return reject(err)
            } else {
                return resolve()
            }
        })

        if (isThenable(res)) {
            return resolve(res)
        } else {
            return undefined
        }
    })
}

export function report(ctx, args) {
    // Reporters are allowed to block, and these are always called first.
    const blocking = []
    const concurrent = []

    // If this becomes a bottleneck, there's other issues.
    for (const reporter of activeReporters(ctx)) {
        if (reporter.block) {
            blocking.push(reporter)
        } else {
            concurrent.push(reporter)
        }
    }

    function pcall(reporter) {
        return maybePromisify(reporter, {
            type: args.type,
            value: args.value,
            path: getPath(ctx),
        })
    }

    return Promise.map(concurrent, pcall)
    .return(blocking)
    .each(pcall)
    .return(undefined)
}

export function runTests(ctx, res) {
    if (res.type !== "pass") {
        // If the init failed, then this has already failed.
        return Promise.resolve(res)
    } else {
        // Tests are called in sequence for obvious reasons.
        return Promise.each(ctx.tests, test => test.run(false))
        .return(res)
    }
}
