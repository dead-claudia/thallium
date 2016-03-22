require! {
    fs: {readFileSync}
    path: {resolve}
}

export help = (value) ->
    file = if value == 'detailed'
        'help-detailed.txt'
    else
        'help-simple.txt'

    # Pad the top by a line.
    console.log!
    console.log readFileSync (resolve __dirname, file), 'utf-8'
