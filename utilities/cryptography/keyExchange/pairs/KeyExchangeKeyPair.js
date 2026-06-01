/*
 * KeyExchangeKeyPair — the algorithm-adapter layer.
 *
 * A plug-and-play strategy that owns EVERY primitive-specific operation: key generation,
 * raw buffer export/import, and the core KEM or DH operation. The KeyExchange protocol class
 * holds one of these and drives the handshake purely through this surface, so the same
 * exchange logic works across schemes (Kyber / x25519 / future) AND across providers
 * (node:crypto, the retired pqclean, noble in the browser) — swap the adapter, keep the protocol.
 *
 * Everything that crosses the wire is a raw Buffer to honour the protocol's smallest-packet goal;
 * DER/PKCS8 wrapping, if a provider needs it, stays an internal detail of the concrete adapter.
 *
 * Concrete adapters MUST implement:
 *   generate(seed?)            → { publicKey, privateKey }  (provider key handles)
 *   exportPublicKey(publicKey) → raw Buffer/ArrayBuffer
 *   exportPrivateKey(privateKey) → raw Buffer/ArrayBuffer (seed form when the scheme has one)
 *   importPublicKey(raw)       → public key handle
 *   importPrivateKey(raw)      → private key handle.
 *
 * Then either KemKeyPair (encapsulate/decapsulate) or DhKeyPair (deriveSharedSecret).
 */
export class KeyExchangeKeyPair {
	static create(config) {
		return new this(config);
	}
	constructor(config = {}) {
		this.algorithm = config.algorithm;
		this.publicKeySize = config.publicKeySize;
		this.privateKeySize = config.privateKeySize;
		this.seedSize = config.seedSize;
		if (config.seedSegments) {
			this.seedSegments = config.seedSegments;
		}
	}
	isKEM = false;
	isDH = false;
}
/**
 * Key Encapsulation Mechanism adapter (ML-KEM/Kyber, HQC, McEliece…). The server encapsulates
 * a fresh secret to the peer's public key and ships the ciphertext; the peer decapsulates it.
 */
export class KemKeyPair extends KeyExchangeKeyPair {
	isKEM = true;
	/**
	 * Encapsulate(publicKey)            → [ciphertext, sharedSecret]
	 * decapsulate(ciphertext, privateKey) → sharedSecret
	 * Implemented by the concrete provider.
	 */
}
/**
 * Diffie–Hellman adapter (x25519…). Both sides derive the same secret from their own private
 * key and the peer's public key; only public keys cross the wire — no ciphertext.
 */
export class DhKeyPair extends KeyExchangeKeyPair {
	isDH = true;
	/**
	 * DeriveSharedSecret(privateKey, peerPublicKey) → sharedSecret
	 * Implemented by the concrete provider.
	 */
}
export default KeyExchangeKeyPair;
