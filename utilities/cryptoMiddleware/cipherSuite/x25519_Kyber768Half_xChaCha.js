// Closed source not for private and or corporate use.
import * as defaultCrypto from '#crypto';
import { assign, clearBuffer, isBuffer } from '@universalweb/acid';
import { decrypt, encrypt } from '../encryption/XChaCha.js';
import { kyber768Half_x25519 } from '../keyExchange/kyber768Half_x25519.js';
const {
	randomConnectionId,
	randomBuffer,
	toBase64,
	toHex,
	blake3CombineKeys,
	get25519Key,
	getKyberKey
} = defaultCrypto;
const {
	clientInitializeSession,
	serverInitializeSession,
	serverSetSession,
	clientSetSession,
	generateSeed,
	keypair,
	clientEphemeralKeypair,
	serverEphemeralKeypair,
	certificateEncryptionKeypair,
	ml_kem768,
	hash
} = kyber768Half_x25519;
export const x25519_kyber768Half_xchacha20 = {
	name: 'x25519_kyber768Half_xchacha20',
	alias: 'hpqt',
	description: 'Hybrid Post Quantum Key Exchange using both Crystals-Kyber768 and X25519 with XChaCha20 and Blake3.',
	id: 1,
	ml_kem768,
	preferred: true,
	speed: 0,
	security: 1,
	compatibility: {
		0: true,
		1: true
	},
	hash,
	decrypt,
	encrypt,
};
// EXAMPLE
// const ogServer = await encryptionKeypair25519();
// const client = await x25519_kyber768Half_xchacha20.clientEphemeralKeypair();
// await x25519_kyber768Half_xchacha20.clientInitializeSession(client, ogServer);
// await x25519_kyber768Half_xchacha20.serverInitializeSession(ogServer, client);
// console.log('CLIENT INITIALIZED', client);
// console.log('OG SERVER', ogServer);
// const server = await x25519_kyber768Half_xchacha20.serverEphemeralKeypair({}, client);
// await x25519_kyber768Half_xchacha20.clientSetSession(client, server);
// await x25519_kyber768Half_xchacha20.serverSetSession(server, client);
// console.log(Buffer.compare(server.transmitKey, client.receiveKey) === 0);
// console.log('CLIENT', client);
// console.log('SERVER', server);
// // TRY AND KEEP ESTIMATED MAX BELOW 1280 (1232)
// console.log('ESTIMATED MAX PACKET SERVER/CLIENT INTRO', 104 + server.publicKey.length, 'KYBER-CIPHERTEXT-OVERHEAD', server.publicKey.length);
// console.log(await x25519_kyber768Half_xchacha20.keypair(), await x25519_kyber768Half_xchacha20.keypair());
