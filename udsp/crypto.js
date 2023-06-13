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
const { seal } = Object;
import {
	encrypt, decrypt, nonceBox, sign, signVerify, createSecretKey,
	signKeypair, encryptKeypair, createSessionKey, clientSessionKeys,
	serverSessionKeys, signPrivateKeyToEncryptPrivateKey, signPublicKeyToEncryptPublicKey,
	signKeypairToEncryptKeypair, getSignPublicKeyFromPrivateKey, keypair,
	boxUnseal, boxSeal
} from '#crypto';
class Cryptography {
	constructor(destination) {
		this.config = destination;
		console.log(destination);
		let {
			aead,
			signature,
			exchange,
		} = destination.cryptography;
		const {
			connectionID = {
				encrypt: 'sealedbox'
			},
			nonce,
			hash,
			alias,
		} = destination.cryptography;
		const { generate } = destination;
		if (alias === 'default') {
			aead = 'xchacha20poly1305';
			signature = 'ed25519';
			exchange = 'x25519';
		}
		if (aead === 'xchacha20poly1305') {
			this.encryptMethod = encrypt;
			this.encryptMethod = decrypt;
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
			if (isTrue(destination.encryptKeypair)) {
				this.generated.encryptKeypair = {
					publicKey: this.signPublicKeyToEncryptPublicKey(destination.publicKey),
				};
			} else if (destination.encryptKeypair) {
				this.generated.encryptKeypair = {
					publicKey: destination.publicKey,
				};
			}
		}
		if (exchange === 'x25519') {
			this.signMethod = sign;
			this.encryptKeypairMethod = encryptKeypair;
			this.keypairMethod = keypair;
			if (generate.keypair) {
				this.generated.keypair = this.keypair();
			}
		}
		if (connectionID) {
			if (connectionID.encrypt === 'sealedbox') {
				this.boxSeal = boxSeal;
				this.boxUnseal = boxUnseal;
				if (generate.connectionIdKeypair) {
					this.generated.connectionIdKeypair = this.generated.keypair;
				}
			}
		}
		if (generate.clientSessionKeys) {
			console.log(this.generated);
			this.generated.sessionKeys = this.clientSessionKeys(this.generated.keypair, this.generated.encryptKeypair.publicKey);
		}
		return this.initialize();
	}
	generated = {};
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
	dencrypt(...args) {
		return this.dencryptMethod(...args);
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
