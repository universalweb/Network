# legacy-pqclean — frozen reference copies

PQClean is deprecated. These are the **original** key-exchange schemes that imported the
`pqclean` package, kept verbatim for reference while the live tree migrates to the native
`node:crypto` (OpenSSL 3.5 ML-KEM) adapter + `KeyExchangeKeyPair` architecture.

| File | Role |
|---|---|
| `kyber.js` | pqclean ML-KEM-768 KeyExchange (superseded by `KyberKeyExchange` + `pairs/kyberNativePair.js`) |
| `kyber768_x25519.js` | pqclean hybrid (x25519 + Kyber768) |
| `kyber769_x25519.js` | pqclean hybrid variant |

**Do not import from this folder in production code.** It exists only so the original
pqclean operations can be diffed/restored if a regression surfaces during migration.
