/**
 * X25519Pair — Diffie–Hellman key-exchange adapter backed by libsodium (X25519).
 *
 * The DH counterpart to the KEM adapters: both peers derive the same secret from their own
 * private key and the peer's public key — only 32-byte public keys cross the wire, no ciphertext.
 * Used standalone (x25519 scheme) and as the classical half of the hybrid schemes.
 *
 * Keys are raw 32-byte buffers; the optional 32-byte seed IS the private scalar (public derived
 * via scalarmult-base), so a seed deterministically reproduces the keypair.
 */
import {
	bufferAlloc,
	int32,
} from '#utilities/cryptography/utils';
import {
	crypto_kx_keypair,
	crypto_scalarmult,
	crypto_scalarmult_base,
} from '#utilities/cryptography/sodium';
import { DhKeyPair } from './KeyExchangeKeyPair.js';
const PUBLIC_KEY_SIZE = int32;
const PRIVATE_KEY_SIZE = int32;
const SHARED_SECRET_SIZE = int32;
export class X25519Pair extends DhKeyPair {
	constructor(config = {}) {
		super({
			algorithm: config.algorithm || 'x25519',
			publicKeySize: PUBLIC_KEY_SIZE,
			privateKeySize: PRIVATE_KEY_SIZE,
			seedSize: PRIVATE_KEY_SIZE,
		});
		this.sharedSecretSize = SHARED_SECRET_SIZE;
	}
	async generate(seed) {
		const publicKey = bufferAlloc(PUBLIC_KEY_SIZE);
		const privateKey = bufferAlloc(PRIVATE_KEY_SIZE);
		if (seed) {
			const seedBuffer = Buffer.isBuffer(seed) ? seed : Buffer.from(seed);
			seedBuffer.copy(privateKey, 0, 0, PRIVATE_KEY_SIZE);
			await crypto_scalarmult_base(publicKey, privateKey);
		} else {
			await crypto_kx_keypair(publicKey, privateKey);
		}
		return {
			publicKey,
			privateKey,
		};
	}
	async deriveSharedSecret(privateKey, peerPublicKey) {
		const sharedSecret = bufferAlloc(SHARED_SECRET_SIZE);
		await crypto_scalarmult(
			sharedSecret,
			privateKey?.privateKey || privateKey,
			peerPublicKey?.publicKey || peerPublicKey
		);
		return sharedSecret;
	}
	importPublicKey(data) {
		return Buffer.isBuffer(data) ? data : Buffer.from(data);
	}
	importPrivateKey(data) {
		return Buffer.isBuffer(data) ? data : Buffer.from(data);
	}
	async exportPublicKey(publicKey) {
		return publicKey;
	}
	async exportPrivateKey(privateKey) {
		return privateKey;
	}
}
export default X25519Pair;
