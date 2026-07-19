# Manrope source

The release package must contain `Manrope.woff2` in this directory. Its
canonical source is:

`/Users/cofob/Development/cofob.dev/static/static/fonts/Manrope.woff2`

The repository may store the exact binary as `Manrope.woff2.base64` so all
tracked edits remain text patches. The build decodes it, validates SHA-256
`b079b975d509b2bac8c43ba6fac399095b9d9eb9bc7761486b5ea675da7b7fd1`, and
emits `dist/fonts/Manrope.woff2`. A byte-for-byte `Manrope.woff2` source is also
accepted. Keep `LICENSES/OFL-1.1.txt` with every release.
