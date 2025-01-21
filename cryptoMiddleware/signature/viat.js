// Permit partial signature possibility
// Requires a hash from each signature to be kept in the final signature
// Means you can verify a partial signature for some operations while not requirering others
// 64 byte hash for message
// final hash summary is 64 bytes
// Threshold Signature Scheme support
// Hash message sign hashedMessage by each key then combine the signatures into one large one or a small one
// Consider hash requirement of dilithium & ed25519 but optional signature for sphincs+
// if first two sigs re required then hash message then hash signature output then combine with sphincs sig if needed
// need to confirm way for address to act like proof of ownership with various keys
