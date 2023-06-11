import {
	construct,
	each,
	assign,
	UniqID,
	isFunction,
	currentPath
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
import {
	ed448, ed448ph, ed448ctx, x448
} from '@noble/curves/ed448';
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
	constructor(config) {
		this.configuration = seal(config);
		const {
			aead,
			nonce,
			hash,
			signature,
			exchange,
			connectionID
		} = config;
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
		}
		if (exchange === 'x25519') {
			this.signMethod = sign;
			this.encryptKeypairMethod = encryptKeypair;
			this.keypairMethod = keypair;
		}
		if (connectionID) {
			if (connectionID.encrypt === 'sealedbox') {
				this.boxSeal = boxSeal;
				this.boxUnseal = boxUnseal;
			}
		}
		return this.initialize();
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
	dencrypt(...args) {
		return this.dencryptMethod(...args);
	}
	convertSignKeypair(...args) {
		return this.convertSignKeypairMethod(...args);
	}
	initialize() {
		return this;
	}
}
