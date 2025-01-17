# CRYPTOGRAPHY

Instead of doing multiple hashes for different key algos
have them return the keys and do the entire buffer concat into a singular hash
make blake3 an alternative hash function
Either use function or make it a class where it can swap out the hashing algorithm or others like key exchanges or signatures

Consider using Public Keys in HASH of secret key similar to x25519 & Kyber similar to x25519_kyber768Half_xchacha20

Make sure a connection cant skip steps - handshake must be enforced
