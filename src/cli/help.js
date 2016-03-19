import * as fs from "fs"
import * as path from "path"

export default function (detailed) {
    const file = detailed ? "help-detailed.txt" : "help-simple.txt"

    // Pad the top by a line.
    console.log()
    console.log(fs.readFileSync(path.resolve(__dirname, file), "utf-8"))
}
