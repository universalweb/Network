# VIAT ADDRESS TYPES

VIAT WALLET ADDRESS TYPES & POSSIBLE SIZES. Using Strict CBOR encoded structure instead of combining keys ensures if a very unlikely rare collision is found it must be a result of a valid CBOR output. This permits using the same size address but with different algos and or removing a key from a multi-algo public key.

### LIST OF POSSIBLE WALLET ADDRESS SIZES

[32, 40, 48, 56, 64, 72, 80, 96]

### EXTENDED ADDRESSES

[104, 128, 256]

LEGACY ADDRESS (Length is => 32)
	- ED25519
LEGACY ADDRESS (Length is => 32)
	- ED25519
STANDARD ADDRESS (Length is => 64)
	- ED25519 + DILITHIUM
		- SPHINCS+ BACKUP
AUDIT ADDRESS (Length is => X)
	- ED25519 + DILITHIUM + SPHINCS
POST QUANTUM ADDRESS (Length is => X)
	- DILITHIUM3 or DILITHIUM5
POST QUANTUM LOW-END ADDRESS (Length is => X)
	- DILITHIUM2 or DILITHIUM3
