# CRYPTO NOTES

## LEVELS

Level 1: Minimum post-quantum security (~128-bit classical, ~64-bit quantum).
Level 3: Stronger protection (~192-bit classical, ~96-bit quantum).
Level 5: Maximum protection (~256-bit classical, ~128-bit quantum).

## PROJECT 2030

### UPDATE VIAT ALGOS for 2030

Category 3 (~AES-192): ML-KEM-768, ML-DSA-65, SLH-DSA-[SHA2/shake]-192[s/f]
Category 5 (~AES-256): ML-KEM-1024, ML-DSA-87, SLH-DSA-[SHA2/shake]-256[s/f]
NIST recommends to use cat-3+, while australian ASD only allows cat-5 after 2030.

SPHINCS+-SHA2-256f-robust (Level 5)
SPHINCS+-SHAKE256-256f-robust (Level 5)
Dilithium Level 5 (Dilithium5)

### STRATEGY

SPHINCS+ Level 5 → Very secure but slower (large signatures ~50KB, slower signing).
Dilithium Level 5 → Fast, moderate size (small signatures ~2KB, efficient).
Hybrid Approach → Use Dilithium5 for performance and SPHINCS+ for long-term fallback.

Hash-based signatures are extremely conservative and have no reliance on number-theoretic assumptions.
Robust variant provides higher resilience against hash function weaknesses.
Level 5 ensures security even if quantum attacks improve significantly.

✅ For maximum long-term security:
SPHINCS+-SHAKE256-256f-robust (Level 5)
Dilithium5

✅ For a hybrid system:
Use Dilithium5 as the primary scheme (fast, practical).
Use SPHINCS+ Level 5 as a backup (in case lattice crypto is broken).

### Implimentation

WALLET HAS ed25519-Dilithium-SPHINCS+
-> Use ed25519-Dilithium Primarily
-> Use SPHINCS+ to initially link initial hybrid keys in case of Dilithium-ed25519 failure
-> Use SPHINCS+ to periodically sign transactions as a way to fortify via snapshot signatures & hashes

### Hashes

SHAKE256
github.com/BLAKE3-team/BLAKE3

BLAKE3 is not as viable as SHAKE256 for quantum-resistance as BLAKE3 has a security limit.
SHAKE256 offers better resistance capabilities for long-term security.
Use SHAKE256 (Extensible Output Function) instead of SHA3-256 (Fixed length)
Post-Quantum Cryptography algos utilize SHAKE256.
Increasing the output size of SHAKE256 enhances its security level, whereas BLAKE3's security level remains unchanged internally.
By increasing the output size for SHAKE256, you directly increase both the classical and quantum security levels.

Quantum computers can attack cryptographic hash functions using Grover’s algorithm, which provides a quadratic speedup over classical brute-force attacks.

BLAKE3 is a 256-bit hash function based on BLAKE2 and the Merkle tree structure.
Quantum pre-image resistance: Grover’s algorithm reduces its effective security from 256 bits → 128 bits.
Quantum collision resistance: If a quantum collision attack is discovered, it could further reduce security.

### Key derivation

SHAKE256 is recommended as an extendable-output function (XOF) for key derivation.
