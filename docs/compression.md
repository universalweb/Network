# The following algos are useful with msgpack based encoding

Compression must occur after msgpack is used but prior to encryption.
The packet must have the compression flags set in the packet footer.

- brotli
- gzip

## Strategies

Compression footer flag then both the header and the body can be compressed if the domain certificate marks compression by default the whole packet can be compressed and send to the client.
The server can also request that the client send packets which compress either the whole packet or just the body, head, footer, and or any combination thereof.
