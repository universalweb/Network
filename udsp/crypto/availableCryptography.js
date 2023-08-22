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
import { assign } from '@universalweb/acid';
const {
	encrypt, decrypt, nonceBox, sign, signVerify, createSecretKey,
	signKeypair, encryptKeypair, createSessionKey, clientSessionKeys,
	serverSessionKeys, signPrivateKeyToEncryptPrivateKey, signPublicKeyToEncryptPublicKey,
	signKeypairToEncryptKeypair, getSignPublicKeyFromPrivateKey, keypair,
	boxUnseal, boxSeal, randomConnectionId, hashMin: defaultHashMin, hash: defaultHash,
} = defaultCrypto;
const x25519XChaChaPoly1305Algo = {
	name: 'x25519-xchacha20-poly1305',
	shortname: 'default',
	nonceBox,
	encryptKeypair,
	createSessionKey,
	clientSessionKeys,
	serverSessionKeys,
	keypair,
	decrypt,
	encrypt,
	id: 0,
	weight: 9,
	signature: 4,
	aead: 5,
};
const ed25519Algo = {
	signKeypair,
	sign,
	signVerify,
	signPrivateKeyToEncryptPrivateKey,
	signPublicKeyToEncryptPublicKey,
	signKeypairToEncryptKeypair,
	getSignPublicKeyFromPrivateKey,
	safeMath: RistrettoPoint,
};
const xsalsa20Algo = {
	boxSeal,
	boxUnseal
};
export class UWCrypto {
	construct(config) {
		const {
			version = this.version,
			publicKeyAlgorithm = 'ed25519',
			cipherSuite = 'x25519-xchacha20-poly1305',
			publicKeyEncryption,
		} = config;
		assign(this, this.algorithms[version][publicKeyAlgorithm]);
		assign(this, this.algorithms[version][cipherSuite]);
		if (publicKeyEncryption) {
			assign(this, this.algorithms[version][publicKeyEncryption]);
		}
	}
	version = 1;
	algorithms = {
		x25519XChaChaPoly1305: x25519XChaChaPoly1305Algo,
		version: {
			1: {
				0: null,
				default: null,
				'x25519-xchacha20-poly1305': x25519XChaChaPoly1305Algo,
				ed25519: ed25519Algo,
				xsalsa20: xsalsa20Algo
			}
		}
	};
}
