import {
	construct,
	each,
	assign,
	UniqID,
	isFunction,
	currentPath,
	isTrue
} from '@universalweb/acid';
import {
	success,
	failed,
	imported,
	msgSent,
	info,
	msgReceived
} from '#logs';
import { secp256k1, schnorr } from '@noble/curves/secp256k1';
import {
	ed25519, ed25519ph, ed25519ctx, x25519, RistrettoPoint
} from '@noble/curves/ed25519';
import { ed448, ed448ph, x448 } from '@noble/curves/ed448';
import { p256 } from '@noble/curves/p256';
import { p384 } from '@noble/curves/p384';
import { p521 } from '@noble/curves/p521';
import { pallas, vesta } from '@noble/curves/pasta';
import { bls12_381 } from '@noble/curves/bls12-381';
import { bn254 } from '@noble/curves/bn254';
import { jubjub } from '@noble/curves/jubjub';
import { sha512, sha512_256, sha384 } from '@noble/hashes/sha512';
import {
	sha3_224, sha3_256, sha3_384, sha3_512,
	keccak_224, keccak_256, keccak_384, keccak_512,
	shake128, shake256
} from '@noble/hashes/sha3';
import {
	cshake128, cshake256, kmac128, kmac256,
	k12, m14,
	tuplehash256, parallelhash256, keccakprg
} from '@noble/hashes/sha3-addons';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { blake3 } from '@noble/hashes/blake3';
import { blake2b } from '@noble/hashes/blake2b';
import { blake2s } from '@noble/hashes/blake2s';
import { hmac } from '@noble/hashes/hmac';
import { hkdf } from '@noble/hashes/hkdf';
import { pbkdf2, pbkdf2Async } from '@noble/hashes/pbkdf2';
import { scrypt, scryptAsync } from '@noble/hashes/scrypt';
const { seal } = Object;
import * as defaultCrypto from '#crypto';
const {
	encrypt, decrypt, nonceBox, sign, signVerify, createSecretKey,
	signKeypair, encryptKeypair, createSessionKey, clientSessionKeys,
	serverSessionKeys, signPrivateKeyToEncryptPrivateKey, signPublicKeyToEncryptPublicKey,
	signKeypairToEncryptKeypair, getSignPublicKeyFromPrivateKey, keypair,
	boxUnseal, boxSeal, randomConnectionId, hashMin: defaultHashMin, hash: defaultHash,
} = defaultCrypto;
class Cryptography {
	constructor(config) {
		this.config = config;
		// console.log(config);
		const { cryptography: cryptographyConfig } = config;
		let {
			encryptClientConnectionId,
			encryptServerConnectionId,
			encryptServerKey,
			encryptClientKey,
			aead = 'xchacha20poly1305',
			hash = 'blake2b',
			signature = 'ed25519',
			exchange = 'x25519',
		} = cryptographyConfig;
		const {
			encryptConnectionId,
			encryptKey,
			nonce,
			alias,
			curve,
			convertEd25519ToX25519,
			connectionIdKeypair
		} = cryptographyConfig;
		const { generate } = config;
		if (alias === 'default') {
			aead = 'xchacha20poly1305';
			signature = 'ed25519';
			exchange = 'x25519';
			hash = 'blake2b';
		}
		if (curve === '25519') {
			if (!exchange) {
				exchange = 'x25519';
			}
			if (!signature) {
				signature = 'ed25519';
			}
		}
		if (aead === 'xchacha20poly1305') {
			this.encryptMethod = encrypt;
			this.decryptMethod = decrypt;
			this.nonceMethod = nonceBox;
			this.createSecretKey = createSecretKey;
			this.createSessionKey = createSessionKey;
			this.clientSessionKeys = clientSessionKeys;
			this.serverSessionKeys = serverSessionKeys;
		}
		if (signature === 'ed25519') {
			this.signMethod = sign;
			this.signVerifyMethod = signVerify;
			this.signKeypairMethod = signKeypair;
			this.signPrivateKeyToEncryptPrivateKey = signPrivateKeyToEncryptPrivateKey;
			this.signPublicKeyToEncryptPublicKey = signPublicKeyToEncryptPublicKey;
			this.signKeypairToEncryptKeypair = signKeypairToEncryptKeypair;
			this.getSignPublicKeyFromPrivateKey = getSignPublicKeyFromPrivateKey;
			this.safeMath = RistrettoPoint;
			if (isTrue(cryptographyConfig.encryptKeypair)) {
				if (config.privateKey) {
					this.encryptionKeypair = signKeypairToEncryptKeypair({
						publicKey: config.publicKey,
						privateKey: config.privateKey
					});
				} else {
					this.encryptionKeypair = signKeypairToEncryptKeypair({
						publicKey: config.publicKey
					});
				}
			} else if (cryptographyConfig.encryptKeypair) {
				this.encryptionKeypair = config.encryptionKeypair;
			}
		}
		if (exchange === 'x25519') {
			this.signMethod = sign;
			this.encryptKeypairMethod = encryptKeypair;
			this.keypairMethod = keypair;
		}
		if (encryptConnectionId) {
			if (!encryptClientConnectionId) {
				encryptClientConnectionId = encryptConnectionId;
			}
			if (!encryptServerConnectionId) {
				encryptServerConnectionId = encryptConnectionId;
			}
		}
		if (encryptClientConnectionId === 'sealedbox') {
			this.encryptClientConnectionId = boxSeal;
			this.decryptClientConnectionId = boxUnseal;
		}
		if (encryptServerConnectionId === 'sealedbox') {
			this.encryptServerConnectionId = boxSeal;
			this.decryptServerConnectionId = boxUnseal;
		}
		if (encryptClientConnectionId || encryptServerConnectionId) {
			if (isTrue(connectionIdKeypair)) {
				this.connectionIdKeypair = this.encryptionKeypair;
			} else if (connectionIdKeypair) {
				this.connectionIdKeypair = connectionIdKeypair;
			}
		}
		if (encryptKey) {
			encryptClientKey = encryptKey;
			encryptServerKey = encryptKey;
		}
		if (encryptClientKey === 'sealedbox') {
			this.encryptClientKey = boxSeal;
			this.decryptClientKey = boxUnseal;
		}
		if (encryptServerKey === 'sealedbox') {
			this.encryptServerKey = boxSeal;
			this.decryptServerKey = boxUnseal;
		}
		if (hash === 'blake3') {
			this.hashMethod = blake3;
		} else if (hash === 'blake2b') {
			this.hashMethod = defaultHash;
			this.hashMinMethod = defaultHashMin;
		}
		if (generate?.keypair) {
			this.generated.keypair = this.keypair();
			this.generated.connectionIdKeypair = this.generated.keypair;
			this.generated.encryptKeypair = this.generated.keypair;
		}
		if (generate?.clientSessionKeys) {
			// console.log(this.encryptionKeypair);
			this.generated.sessionKeys = this.clientSessionKeys(this.generated.keypair, this.encryptionKeypair.publicKey);
		}
		assign(this.config, {
			encryptClientConnectionId,
			encryptServerConnectionId,
			encryptConnectionId,
			encryptClientKey,
			encryptServerKey
		});
		if (this.encryptMethod.overhead) {
			this.encryptOverhead = this.encryptMethod.overhead;
		}
		return this.initialize();
	}
	generated = {
		destination: {}
	};
	hash(...args) {
		return this.hashMethod(...args);
	}
	hashMin(...args) {
		return this.hashMinMethod(...args);
	}
	signKeypair(...args) {
		return this.signKeypairMethod(...args);
	}
	keypair(...args) {
		return this.keypairMethod(...args);
	}
	encryptKeypair(...args) {
		return this.encryptKeypairMethod(...args);
	}
	signVerify(...args) {
		return this.signVerifyMethod(...args);
	}
	sign(...args) {
		return this.signMethod(...args);
	}
	nonce(...args) {
		return this.nonceMethod(...args);
	}
	encrypt(...args) {
		return this.encryptMethod(...args);
	}
	decrypt(...args) {
		return this.decryptMethod(...args);
	}
	convertSignKeypair(...args) {
		return this.convertSignKeypairMethod(...args);
	}
	async initialize() {
		return this;
	}
}
export function cryptography(...args) {
	return construct(Cryptography, args);
}
