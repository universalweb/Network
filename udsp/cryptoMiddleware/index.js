import * as defaultCrypto from '#crypto';
import {
	RistrettoPoint,
	ed25519,
	ed25519ctx,
	ed25519ph,
	x25519
} from '@noble/curves/ed25519';
import { assign, hasValue } from '@universalweb/acid';
import {
	cshake128,
	cshake256,
	k12,
	keccakprg,
	kmac128,
	kmac256,
	m14,
	parallelhash256,
	tuplehash256
} from '@noble/hashes/sha3-addons';
import { ed448, ed448ph, x448 } from '@noble/curves/ed448';
import {
	keccak_224,
	keccak_256,
	keccak_384,
	keccak_512,
	sha3_224,
	sha3_256,
	sha3_384,
	sha3_512,
	shake128,
	shake256
} from '@noble/hashes/sha3';
import { pallas, vesta } from '@noble/curves/pasta';
import { pbkdf2, pbkdf2Async } from '@noble/hashes/pbkdf2';
import { schnorr, secp256k1 } from '@noble/curves/secp256k1';
import { scrypt, scryptAsync } from '@noble/hashes/scrypt';
import { sha384, sha512, sha512_256 } from '@noble/hashes/sha512';
import { blake2b } from '@noble/hashes/blake2b';
import { blake2s } from '@noble/hashes/blake2s';
import { blake3 } from '@noble/hashes/blake3';
import { bls12_381 } from '@noble/curves/bls12-381';
import { bn254 } from '@noble/curves/bn254';
import { hkdf } from '@noble/hashes/hkdf';
import { hmac } from '@noble/hashes/hmac';
import { jubjub } from '@noble/curves/jubjub';
import { p256 } from '@noble/curves/p256';
import { p384 } from '@noble/curves/p384';
import { p521 } from '@noble/curves/p521';
import { ripemd160 } from '@noble/hashes/ripemd160';
const { seal } = Object;
const {
	encrypt, decrypt, nonceBox, sign, signVerify, createSecretKey,
	signKeypair, encryptKeypair, createSessionKey, clientSessionKeys,
	serverSessionKeys, signPrivateKeyToEncryptPrivateKey, signPublicKeyToEncryptPublicKey,
	signKeypairToEncryptionKeypair, getSignPublicKeyFromPrivateKey, keypair,
	boxUnseal, boxSeal, randomConnectionId, hashMin: defaultHashMin, hash: defaultHash,
} = defaultCrypto;
const x25519XChaChaPoly1305Algo = {
	name: 'x25519-xchacha20-poly1305',
	alias: 'default',
	id: 0,
	nonceBox,
	encryptKeypair,
	createSessionKey,
	keypair,
	decrypt,
	encrypt,
};
const ed25519Algo = {
	name: 'ed25519',
	alias: 'default',
	id: 0,
	signKeypair,
	sign,
	signVerify,
	signPrivateKeyToEncryptPrivateKey,
	signPublicKeyToEncryptPublicKey,
	signKeypairToEncryptionKeypair,
	getSignPublicKeyFromPrivateKey,
	safeMath: RistrettoPoint,
	clientSessionKeys,
	serverSessionKeys,
};
const xsalsa20Algo = {
	boxSeal,
	boxUnseal
};
export const publicKeyAlgorithms = {
	ed25519: ed25519Algo,
	0: ed25519Algo,
	default: ed25519Algo,
	version: {
		1: {
			ed25519: ed25519Algo,
			0: ed25519Algo,
			default: ed25519Algo
		}
	}
};
export const cipherSuites = {
	'x25519-xchacha20-poly1305': x25519XChaChaPoly1305Algo,
	0: x25519XChaChaPoly1305Algo,
	default: x25519XChaChaPoly1305Algo,
	version: {
		1: {
			'x25519-xchacha20-poly1305': x25519XChaChaPoly1305Algo,
			0: x25519XChaChaPoly1305Algo,
			default: x25519XChaChaPoly1305Algo
		}
	},
	available: {
		1: ['x25519-xchacha20-poly1305']
	}
};
export const boxAlgorithms = {
	xsalsa20: xsalsa20Algo,
	0: xsalsa20Algo,
	default: xsalsa20Algo,
	version: {
		1: {
			xsalsa20: xsalsa20Algo,
			0: xsalsa20Algo,
			default: xsalsa20Algo,
		}
	}
};
export const algorithms = {};
assign(algorithms, publicKeyAlgorithms);
assign(algorithms, boxAlgorithms);
assign(algorithms, cipherSuites);
const currentVersion = 1;
export function getAlgorithm(cipherSuite, version) {
	if (!hasValue(cipherSuite)) {
		return false;
	}
	const result = algorithms.version[version || currentVersion][cipherSuite];
	return result || algorithms[cipherSuite];
}
export function getCipherSuite(cipherSuite, version) {
	if (!hasValue(cipherSuite)) {
		return false;
	}
	const result = cipherSuites.version[version || currentVersion][cipherSuite];
	return result || cipherSuites[cipherSuite];
}
export function getPublicKeyAlgorithm(cipherSuite, version) {
	if (!hasValue(cipherSuite)) {
		return false;
	}
	const result = publicKeyAlgorithms.version[version || currentVersion][cipherSuite];
	return result || publicKeyAlgorithms[cipherSuite];
}
export function processPublicKey(certificate) {
	console.log('keypairType', certificate);
	const {
		publicKeyAlgorithm,
		encryptionKeypair,
		privateKey,
		publicKey
	} = certificate;
	if (!encryptionKeypair && publicKeyAlgorithm === 'ed25519') {
		if (publicKeyAlgorithm === 'ed25519') {
			const publicKeyCryptography = getAlgorithm(publicKeyAlgorithm);
			if (privateKey) {
				return publicKeyCryptography.signKeypairToEncryptionKeypair({
					publicKey,
					privateKey
				});
			} else {
				return publicKeyCryptography.signKeypairToEncryptionKeypair({
					publicKey
				});
			}
		}
	}
}
