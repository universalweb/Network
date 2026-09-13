/*
 * KyberNativePair — ML-KEM (FIPS 203) KEM adapter backed by native node:crypto (OpenSSL 3.5+).
 * Replaces the retired pqclean provider. Generates ephemeral or seeded keypairs, performs
 * encapsulate/decapsulate, and exports/imports keys as raw buffers for smallest-packet transport.
 *
 * Wire/storage forms (CBOR handles persistence elsewhere — never PKCS8):
 *   public  → raw 1184-byte key
 *   private → raw 64-byte FIPS 203 seed (d‖z); the expanded 2400-byte dk lives only in the KeyObject.
 */
import crypto from 'node:crypto';
import { findItem } from '@universalweb/utilitylib';
import { int32, int64 } from '#utilities/cryptography/utils';
import { KemKeyPair } from './KeyExchangeKeyPair.js';
const algoList = [
	{
		name: 'ml-kem-768',
		publicKeySize: 1184,
		// Expanded FIPS 203 decapsulation-key size — descriptor only; native crypto holds the
		// expanded key inside the KeyObject and never serializes it. The stored private is the seed.
		privateKeySize: 2400,
		encryptedKeySize: 1088,
		seedSize: int64,
		// ML-KEM.KeyGen consumes two independent 32-byte seeds — both required to reproduce a key
		seedSegments: [
			{
				name: 'd',
				size: int32,
				role: 'expansion',
			},
			{
				name: 'z',
				size: int32,
				role: 'implicitRejection',
			},
		],
	},
];
const primaryAlgo = algoList[0];
const SEED_SIZE = primaryAlgo.seedSize;
const RAW_PUBLIC_KEY_SIZE = primaryAlgo.publicKeySize;
/*
 * Native crypto rejects bare ML-KEM key/seed bytes — it only ingests DER. Peers send raw public
 * keys and we store private keys as the raw d‖z seed, so both get re-wrapped with their scheme
 * DER headers on the way back in. Derived once from a probe key so the OID and length bytes track
 * exactly what OpenSSL emits, instead of rotting as hardcoded blobs when another variant is added.
 */
function deriveDerPrefixes(algorithm, rawPublicKeySize, seedByteLength) {
	const {
		publicKey, privateKey,
	} = crypto.generateKeyPairSync(algorithm);
	const spki = publicKey.export({
		format: 'der',
		/* eslint-disable-next-line no-restricted-syntax */
		type: 'spki',
	});
	const pkcs8 = privateKey.export({
		format: 'der',
		/* eslint-disable-next-line no-restricted-syntax */
		type: 'pkcs8',
	});
	return {
		spkiPrefix: Buffer.from(spki.subarray(0, spki.length - rawPublicKeySize)),
		seedPkcs8Prefix: Buffer.from(pkcs8.subarray(0, pkcs8.length - seedByteLength)),
	};
}
const {
	spkiPrefix: SPKI_PREFIX,
	seedPkcs8Prefix: PKCS8_SEED_PREFIX,
} = deriveDerPrefixes(primaryAlgo.name, RAW_PUBLIC_KEY_SIZE, SEED_SIZE);
function privateKeyFromSeed(seed) {
	if (seed.length !== SEED_SIZE) {
		throw new Error(`ml-kem seed must be ${SEED_SIZE} bytes (d‖z); received ${seed.length}`);
	}
	const der = Buffer.concat([PKCS8_SEED_PREFIX, seed]);
	return crypto.createPrivateKey({
		key: der,
		format: 'der',
		/* eslint-disable-next-line no-restricted-syntax */
		type: 'pkcs8',
	});
}
class PublicKey {
	constructor(algorithm, data) {
		this.algorithm = algorithm;
		if (data instanceof crypto.KeyObject) {
			this.key = data;
		} else {
			const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
			// A bare raw key needs the SPKI header re-attached; a full DER passes straight through
			const der = (buf.length === RAW_PUBLIC_KEY_SIZE) ? Buffer.concat([SPKI_PREFIX, buf]) : buf;
			this.key = crypto.createPublicKey({
				key: der,
				format: 'der',
				/* eslint-disable-next-line no-restricted-syntax */
				type: 'spki',
			});
		}
	}
	export() {
		const der = this.key.export({
			format: 'der',
			/* eslint-disable-next-line no-restricted-syntax */
			type: 'spki',
		});
		// Strip the SPKI header back to the raw key. Copy the exact window — .buffer alone returns
		// the whole backing store and ignores byteOffset, leaking the prefix.
		const raw = der.subarray(SPKI_PREFIX.length);
		return raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
	}
}
class PrivateKey {
	constructor(algorithm, data) {
		this.algorithm = algorithm;
		if (data instanceof crypto.KeyObject) {
			this.key = data;
		} else {
			const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
			// A bare d‖z seed needs the PKCS8 header re-attached; a full DER passes straight through
			const der = (buf.length === SEED_SIZE) ? Buffer.concat([PKCS8_SEED_PREFIX, buf]) : buf;
			this.key = crypto.createPrivateKey({
				key: der,
				format: 'der',
				/* eslint-disable-next-line no-restricted-syntax */
				type: 'pkcs8',
			});
		}
	}
	export() {
		const der = this.key.export({
			format: 'der',
			/* eslint-disable-next-line no-restricted-syntax */
			type: 'pkcs8',
		});
		// Native PKCS8 is seed-format — strip the ASN.1 header to the raw d‖z seed (the portable private)
		const seed = der.subarray(der.length - SEED_SIZE);
		return seed.buffer.slice(seed.byteOffset, seed.byteOffset + seed.byteLength);
	}
}
export class KyberNativePair extends KemKeyPair {
	constructor(config = {}) {
		const scheme = findItem(algoList, config.algorithm, 'name') || primaryAlgo;
		super({
			algorithm: scheme.name,
			publicKeySize: scheme.publicKeySize,
			privateKeySize: scheme.privateKeySize,
			seedSize: scheme.seedSize,
			seedSegments: scheme.seedSegments,
		});
		this.encryptedKeySize = scheme.encryptedKeySize;
		this.PublicKey = PublicKey;
		this.PrivateKey = PrivateKey;
	}
	async generate(seed) {
		if (seed) {
			const seedBuffer = Buffer.isBuffer(seed) ? seed : Buffer.from(seed);
			const privateKeyObject = privateKeyFromSeed(seedBuffer);
			return {
				publicKey: new PublicKey(this.algorithm, crypto.createPublicKey(privateKeyObject)),
				privateKey: new PrivateKey(this.algorithm, privateKeyObject),
			};
		}
		const {
			publicKey, privateKey,
		} = crypto.generateKeyPairSync(this.algorithm);
		return {
			publicKey: new PublicKey(this.algorithm, publicKey),
			privateKey: new PrivateKey(this.algorithm, privateKey),
		};
	}
	async encapsulate(publicKey) {
		const {
			sharedKey, ciphertext,
		} = crypto.encapsulate(publicKey.key);
		return [
			Buffer.from(ciphertext),
			Buffer.from(sharedKey),
		];
	}
	async decapsulate(ciphertext, privateKey) {
		return Buffer.from(crypto.decapsulate(privateKey.key, ciphertext));
	}
	importPublicKey(data) {
		return new PublicKey(this.algorithm, data);
	}
	importPrivateKey(data) {
		return new PrivateKey(this.algorithm, data);
	}
	async exportPublicKey(publicKey) {
		return publicKey.export();
	}
	async exportPrivateKey(privateKey) {
		return privateKey.export();
	}
}
export default KyberNativePair;
