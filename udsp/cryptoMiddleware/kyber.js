import * as defaultCrypto from '#crypto';
import { clearBuffer, isBuffer } from '@universalweb/acid';
import { blake3 } from '@noble/hashes/blake3';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { x25519_xchacha20 } from './25519.js';
const {
	encrypt, decrypt, nonceBox, sign, signVerify, createSecretKey,
	signKeypair, encryptKeypair, createSessionKey, clientSessionKeys,
	serverSessionKeys, signPrivateKeyToEncryptPrivateKey, signPublicKeyToEncryptPublicKey,
	signKeypairToEncryptionKeypair, getSignPublicKeyFromPrivateKey, keypair,
	boxUnseal, boxSeal, randomConnectionId, hashMin: defaultHashMin, hash: defaultHash,
	signVerifyDetached, signDetached, crypto_aead_xchacha20poly1305_ietf_KEYBYTES, randomBuffer, toBase64
} = defaultCrypto;
export function blake3CombineKeys(key1, key2) {
	// console.log(key1, key2);
	return blake3(Buffer.concat([key1, key2]));
}
export async function createKyberKeypair(seed) {
	const kyberKeypair = ml_kem768.keygen(seed);
	return {
		publicKey: kyberKeypair.publicKey,
		privateKey: kyberKeypair.secretKey
	};
}
function clearSessionKeys(source) {
	clearBuffer(source.transmitKey);
	clearBuffer(source.receiveKey);
	source.transmitKey = null;
	source.receiveKey = null;
}
async function kyberDecapsulate(source, destinationKeypair, x25519SessionKeys) {
	const cipherText = destinationKeypair.publicKey.slice(32);
	console.log(cipherText, source.kyberKeypair.privateKey);
	const kyberSharedSecret = ml_kem768.decapsulate(cipherText, source.kyberKeypair.privateKey);
	console.log('server cipherText', cipherText, cipherText.length);
	source.transmitKey = blake3CombineKeys(x25519SessionKeys.transmitKey, kyberSharedSecret);
	source.receiveKey = blake3CombineKeys(x25519SessionKeys.receiveKey, kyberSharedSecret);
	clearSessionKeys(x25519SessionKeys);
}
export const x25519_kyber768_xchacha20 = {
	name: 'x25519_kyber768_xchacha20',
	short: 'x25519Kyber768',
	// Hybrid Post Quantum Key Exchange
	alias: 'hpqt',
	id: 1,
	ml_kem768,
	preferred: true,
	hash: blake3,
	x25519ServerSessionKeys: serverSessionKeys,
	x25519ClientSessionKeys: clientSessionKeys,
	kyberDecapsulate,
	async serverSessionKeys(source, destination) {
		const destinationPublicKey = destination.publicKey;
		const x25519SessionKeys = serverSessionKeys(source.x25519Keypair, destinationPublicKey.slice(0, 32));
		// console.log(x25519SessionKeys);
		const kyberRelated = destination.publicKey.slice(32);
		await kyberDecapsulate(source, destination, x25519SessionKeys);
		console.log('Decapsulate kyberSharedSecret', source.transmitKey);
	},
	async clientIntro(source, destination) {
		const destinationPublicKey = destination.publicKey;
		const x25519SessionKeys = serverSessionKeys(source.x25519Keypair, destinationPublicKey.slice(0, 32));
		await kyberDecapsulate(source, destination);
	},
	async clientSessionKeys(source, destination) {
		const destinationPublicKey = destination.publicKey;
		const x25519SessionKeys = clientSessionKeys(source.x25519Keypair, destinationPublicKey.slice(0, 32));
		const {
			cipherText: cipherTextUnit8,
			sharedSecret: kyberSharedSecretUnit8
		} = await ml_kem768.encapsulate(destinationPublicKey.slice(32));
		const cipherText = cipherTextUnit8;
		const kyberSharedSecret = kyberSharedSecretUnit8;
		console.log('client kyberSharedSecret', kyberSharedSecret);
		console.log('client cipherText', cipherText, cipherText.length);
		source.transmitKey = blake3CombineKeys(x25519SessionKeys.transmitKey, kyberSharedSecret);
		source.receiveKey = blake3CombineKeys(x25519SessionKeys.receiveKey, kyberSharedSecret);
	},
	async loadKeypair(source) {
		const { privateKey } = source;
		const seed = privateKey.slice(32);
		const kyberKeypair = createKyberKeypair(seed);
		const {
			publicKey: kyberPublicKey,
			privateKey: kyberPrivateKey
		} = kyberKeypair;
		source.kyberKeypair = {
			privateKey: kyberPrivateKey,
			publicKey: kyberPublicKey
		};
		source.x25519Keypair = {
			privateKey: privateKey.slice(0, 32),
			publicKey: source.publicKey.slice(0, 32)
		};
	},
	generateKeySeed() {
		return randomBuffer(64);
	},
	createKyberKeypair,
	async ephemeralKeypair(destination) {
		const target = keypair();
		await x25519_kyber768_xchacha20.clientSessionKeys(target, destination);
		return target;
	},
	async keypair(seedArg) {
		const x25519Keypair = x25519_xchacha20.keypair();
		const seed = seedArg || x25519_kyber768_xchacha20.generateKeySeed();
		const kyberKeypair = await createKyberKeypair(seed);
		const target = {
			publicKey: Buffer.concat([x25519Keypair.publicKey, kyberKeypair.publicKey]),
			privateKey: Buffer.concat([x25519Keypair.privateKey, kyberKeypair.privateKey])
		};
		return target;
	},
	async certificateEncryptionKeypair() {
		const {
			x25519Keypair,
			kyberKeypair,
			publicKey
		} = x25519_kyber768_xchacha20.keypair();
		const target = {
			publicKey: Buffer.concat([x25519Keypair.publicKey, kyberKeypair.publicKey]),
			privateKey: Buffer.concat([x25519Keypair.privateKey, kyberKeypair.privateKey])
		};
		return target;
	},
	combineKeys: blake3CombineKeys
};
// const client = await x25519_kyber768_xchacha20.keypair();
// const server = await x25519_kyber768_xchacha20.keypair();
// await x25519_kyber768_xchacha20.clientSessionKeys(client, server);
// await x25519_kyber768_xchacha20.serverSessionKeys(server, client);
// console.log(client.publicKey.length);
// console.log(server.transmitKey);
// console.log(encrypt(boxSeal(randomBuffer(1120), keypair()), server.transmitKey).length);
// console.log('Client', clientSession.transmitKey);
// console.log('Server', serverSession.receiveKey);
// console.log(Buffer.compare(clientSession.transmitKey, serverSession.receiveKey));
// console.log(alice.kyberKeypair.publicKey.length);
// TRY AND KEEP ESTIMATED MAX BELOW 1280
// console.log('ESTIMATED MAX PACKET SERVER/CLIENT INTRO', 104 + rawCipherText.length, 'KYBER-CIPHERTEXT-OVERHEAD', rawCipherText.length);
