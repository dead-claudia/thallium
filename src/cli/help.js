import {readFileSync} from "fs"
import {resolve} from "path"

export function help(value) {
    const file = value === "detailed" ? "help-detailed.txt" : "help-simple.txt"

    // Pad the top by a line.
    console.log()
    console.log(readFileSync(resolve(__dirname, file), "utf-8"))
}
