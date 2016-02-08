Note that this directory is purposefully *not* batch-exported through
`directories.bin`, and all CLI utilities need to be explicitly registered.

Also note that this has a couple .npmignore rules applied to it to exclude this
file and dot files (e.g. .eslintrc), to strip dev crud when installing.
