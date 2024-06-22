import * as defaultCrypto from '#crypto';
import { createSessionKey, nonceBox } from './XChaCha.js';
import {
	getSignaturePublicKeyFromPrivateKey,
	sign,
	signDetached,
	signatureKeypair,
	signatureKeypairToEncryptionKeypair,
	signaturePrivateKeyToEncryptPrivateKey,
	signaturePublicKeyToEncryptPublicKey,
	verifySignature,
	verifySignatureDetached,
} from './ed25519.js';
import { blake3 } from '@noble/hashes/blake3';
import { encryptionKeypair, } from './x25519.js';
const sodium = await import('sodium-native');
const sodiumLib = sodium?.default || sodium;
const {
	crypto_kx_client_session_keys,
	crypto_kx_server_session_keys,
} = sodiumLib;
const {
	encrypt, decrypt, randomConnectionId, hashMin: defaultHashMin, hash: defaultHash, randomBuffer, toBase64
} = defaultCrypto;
export function clientSessionKeys(client, serverPublicKey, target) {
	const receiveKey = client?.receiveKey || createSessionKey();
	const transmitKey = client?.transmitKey || createSessionKey();
	crypto_kx_client_session_keys(receiveKey, transmitKey, client.publicKey, client.privateKey, serverPublicKey?.publicKey || serverPublicKey);
	if (target) {
		target.receiveKey = receiveKey;
		target.transmitKey = transmitKey;
		return target;
	}
	client.receiveKey = receiveKey;
	return {
		receiveKey,
		transmitKey
	};
}
export function serverSessionKeys(server, client, target) {
	const receiveKey = server?.receiveKey || createSessionKey();
	const transmitKey = server?.transmitKey || createSessionKey();
	crypto_kx_server_session_keys(receiveKey, transmitKey, server.publicKey, server.privateKey, client?.publicKey || client);
	if (target) {
		target.receiveKey = receiveKey;
		target.transmitKey = transmitKey;
		return target;
	}
	return {
		receiveKey,
		transmitKey
	};
}
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
		return encryptionKeypair(source);
	},
	createSessionKey,
	async keypair(source) {
		return encryptionKeypair(source);
	},
	async ephemeralServerKeypair(destination) {
		const source = encryptionKeypair();
		source.framePublicKey = source.publicKey;
		return source;
	},
	async ephemeralKeypair(destination) {
		const generatedKeypair = encryptionKeypair();
		generatedKeypair.headerPublicKey = generatedKeypair.publicKey;
		return generatedKeypair;
	},
	certificateEncryptionKeypair: encryptionKeypair,
	decrypt,
	encrypt,
	clientSessionKeys: clientSessionKeysAttach,
	async clientInitialSession(...args) {
		return clientSessionKeysAttach(...args);
	},
	serverSessionKeys: serverSessionKeysAttach,
	preferred: true,
	hash: blake3,
};
