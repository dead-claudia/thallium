// I can't just subclass Error here, since Babel doesn't support that.
export function ArgumentError(message) {
    this.message = message

    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ArgumentError)
    } else {
        const e = new Error(message)

        e.name = this.name
        this.stack = e.stack
    }
}

ArgumentError.prototype = Object.create(Error.prototype, {
    constructor: {
        configurable: true,
        enumerable: false,
        writable: true,
        value: ArgumentError,
    },

    name: {
        configurable: true,
        enumerable: false,
        writable: true,
        value: "ArgumentError",
    },
})
