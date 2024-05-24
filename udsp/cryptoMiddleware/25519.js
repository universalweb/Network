import * as defaultCrypto from '#crypto';
import { RistrettoPoint } from '@noble/curves/ed25519';
import { blake3 } from '@noble/hashes/blake3';
const {
	encrypt, decrypt, nonceBox, sign, signVerify, createSecretKey,
	signKeypair, encryptKeypair, createSessionKey, clientSessionKeys,
	serverSessionKeys, signPrivateKeyToEncryptPrivateKey, signPublicKeyToEncryptPublicKey,
	signKeypairToEncryptionKeypair, getSignPublicKeyFromPrivateKey, keypair,
	boxUnseal, boxSeal, randomConnectionId, hashMin: defaultHashMin, hash: defaultHash,
	signVerifyDetached, signDetached, crypto_aead_xchacha20poly1305_ietf_KEYBYTES, randomBuffer, toBase64
} = defaultCrypto;
async function serverSessionKeysAttach(source, destination) {
	return serverSessionKeys(source, destination, source);
}
async function clientSessionKeysAttach(source, destination) {
	return clientSessionKeys(source, destination, source);
}
export const x25519_xchacha20 = {
	name: 'x25519_xchacha20',
	short: 'x25519',
	alias: 'default',
	id: 0,
	nonceBox,
	async encryptKeypair(source) {
		return encryptKeypair(source);
	},
	createSessionKey,
	async keypair(source) {
		return keypair(source);
	},
	async ephemeralServerKeypair(destination) {
		return keypair();
	},
	async ephemeralKeypair(destination) {
		return keypair();
	},
	certificateEncryptionKeypair: keypair,
	decrypt,
	encrypt,
	safeMath: RistrettoPoint,
	clientSessionKeys: clientSessionKeysAttach,
	serverSessionKeys: serverSessionKeysAttach,
	preferred: true,
	hash: blake3,
};
export const ed25519Algo = {
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
