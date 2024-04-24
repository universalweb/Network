/* TODO: Add Mobile/Embedded Preferred option & algorithms. */
import * as defaultCrypto from '#crypto';
import { Kyber1024, Kyber512, Kyber768 } from 'crystals-kyber-js';
import {
	RistrettoPoint,
	ed25519,
	ed25519ctx,
	ed25519ph,
	x25519
} from '@noble/curves/ed25519';
import {
	assign,
	compactMapArray,
	eachArray,
	hasValue,
	isArray,
	isNumber
} from '@universalweb/acid';
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
import { currentCertificateVersion, currentVersion } from '../defaults.js';
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
	signVerifyDetached, signDetached
} = defaultCrypto;
const x25519_xchacha20 = {
	name: 'x25519_xchacha20',
	short: 'x25519',
	alias: 'default',
	id: 0,
	nonceBox,
	encryptKeypair,
	createSessionKey,
	keypair,
	decrypt,
	encrypt,
	safeMath: RistrettoPoint,
	clientSessionKeys,
	serverSessionKeys,
	preferred: true,
	hash: blake3,
};
const x25519_kyber768_xchacha20 = {
	name: 'x25519_kyber768_xchacha20',
	short: 'x25519Kyber768',
	// Post Quantum Key Exchange
	alias: 'pqt',
	id: 1,
	Kyber768,
	preferred: true,
	hash: blake3,
};
const ed25519Algo = {
	name: 'ed25519',
	alias: 'default',
	id: 0,
	signKeypair,
	sign,
	signVerify,
	signDetached,
	signPrivateKeyToEncryptPrivateKey,
	signPublicKeyToEncryptPublicKey,
	signKeypairToEncryptionKeypair,
	getSignPublicKeyFromPrivateKey,
	safeMath: RistrettoPoint,
	clientSessionKeys,
	serverSessionKeys,
	signVerifyDetached,
	hash: blake3,
	preferred: true
};
const xsalsa20Algo = {
	name: 'xsalsa20Algo',
	alias: 'default',
	id: 0,
	boxSeal,
	boxUnseal,
	preferred: true
};
export const publicKeyAlgorithms = new Map();
const publicKeyAlgorithmVersion1 = new Map();
publicKeyAlgorithms.set(1, publicKeyAlgorithmVersion1);
publicKeyAlgorithmVersion1.set(ed25519Algo.name, ed25519Algo);
publicKeyAlgorithmVersion1.set(ed25519Algo.id, ed25519Algo);
publicKeyAlgorithmVersion1.set(ed25519Algo.alias, ed25519Algo);
export const publicKeyCertificateAlgorithms = new Map();
const publicKeyCertificateAlgorithmsVersion1 = new Map();
publicKeyCertificateAlgorithms.set(1, publicKeyCertificateAlgorithmsVersion1);
publicKeyCertificateAlgorithmsVersion1.set(ed25519Algo.name, ed25519Algo);
publicKeyCertificateAlgorithmsVersion1.set(ed25519Algo.id, ed25519Algo);
publicKeyCertificateAlgorithmsVersion1.set(ed25519Algo.alias, ed25519Algo);
export const cipherSuites = new Map();
const cipherSuitesVersion1 = new Map();
cipherSuites.set(1, cipherSuitesVersion1);
cipherSuitesVersion1.set('all', [x25519_xchacha20]);
cipherSuitesVersion1.set(x25519_xchacha20.name, x25519_xchacha20);
cipherSuitesVersion1.set(x25519_xchacha20.id, x25519_xchacha20);
cipherSuitesVersion1.set(x25519_xchacha20.alias, x25519_xchacha20);
export const cipherSuitesCertificates = new Map();
const cipherSuitesCertificatesVersion1 = new Map();
cipherSuitesCertificates.set(1, cipherSuitesCertificatesVersion1);
cipherSuitesCertificatesVersion1.set('all', [x25519_xchacha20]);
cipherSuitesCertificatesVersion1.set(x25519_xchacha20.short, x25519_xchacha20);
cipherSuitesCertificatesVersion1.set(x25519_xchacha20.id, x25519_xchacha20);
cipherSuitesCertificatesVersion1.set(x25519_xchacha20.alias, x25519_xchacha20);
export const boxAlgorithms = new Map();
const boxAlgorithmsVersion1 = new Map();
boxAlgorithms.set(1, boxAlgorithmsVersion1);
boxAlgorithmsVersion1.set(xsalsa20Algo.name, xsalsa20Algo);
boxAlgorithmsVersion1.set(xsalsa20Algo.id, xsalsa20Algo);
boxAlgorithmsVersion1.set(xsalsa20Algo.alias, xsalsa20Algo);
const blake3Hash = {
	name: 'blake3',
	alias: 'default',
	id: 0,
	hash: blake3,
	preferred: true
};
export const hashAlgorithms = new Map();
const hashAlgorithmsVersion1 = new Map();
boxAlgorithms.set(1, hashAlgorithmsVersion1);
hashAlgorithmsVersion1.set(blake3Hash.name, blake3Hash);
hashAlgorithmsVersion1.set(blake3Hash.id, blake3Hash);
hashAlgorithmsVersion1.set(blake3Hash.alias, blake3Hash);
export function getEncryptionKeypairAlgorithm(algo = 0, version = currentCertificateVersion) {
	if (!hasValue(algo)) {
		return false;
	}
	const cipherVersion = cipherSuitesCertificates.get(version);
	if (cipherVersion) {
		return cipherVersion.get(algo);
	}
}
export function getCipherSuite(cipherSuiteName = 0, version = currentVersion) {
	if (!hasValue(cipherSuiteName)) {
		return false;
	}
	const cipherVersion = cipherSuites.get(version);
	if (cipherVersion) {
		return cipherVersion.get(cipherSuiteName);
	}
}
export function getCipherSuites(indexes, version = currentVersion) {
	if (indexes) {
		if (isNumber(indexes)) {
			return getCipherSuite(indexes, version);
		} else if (isArray(indexes)) {
			const cipherSuitesArray = compactMapArray(indexes, (value) => {
				const cipherSuite = getCipherSuite(value, version);
				if (cipherSuite) {
					cipherSuitesArray.push(cipherSuite);
				}
			});
			return cipherSuitesArray;
		}
	}
	return getCipherSuite('all', version);
}
export function getSignatureAlgorithm(publicKeyAlgorithmName = 0, version = currentVersion) {
	if (!hasValue(publicKeyAlgorithmName)) {
		return false;
	}
	const algoVersion = publicKeyAlgorithms.get(version);
	if (algoVersion) {
		return algoVersion.get(publicKeyAlgorithmName);
	}
}
export function getSignatureAlgorithmByCertificate(publicKeyAlgorithmName = 0, version = currentCertificateVersion) {
	if (!hasValue(publicKeyAlgorithmName)) {
		return false;
	}
	const algoVersion = publicKeyCertificateAlgorithms.get(version);
	if (algoVersion) {
		return algoVersion.get(publicKeyAlgorithmName);
	}
}
export function getHashAlgorithm(hashAlgorithmName = 0, version = currentVersion) {
	if (!hasValue(hashAlgorithmName)) {
		return false;
	}
	const algoVersion = hashAlgorithms.get(version);
	if (algoVersion) {
		return algoVersion.get(hashAlgorithmName);
	}
}
