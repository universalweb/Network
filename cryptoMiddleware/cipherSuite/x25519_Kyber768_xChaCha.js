// Closed source not for private and or corporate use.
/*
	SUMMARY:
	In the first initial packet x25519 encryption can already be used.
	Both the server and client have a functioning x25519 key exchange with their first packets.
	From there the key exchange process incorporates the kyber768 key exchange.
	Session keys are created by hashing the combined keys of the prior session keys and the new ones.
	Hashing ensures that keys remain the same size, ensure consistant performance, reduces memory, and authenticates the domain certificate/server in the process.
	Hashing prior keys ensures a continuous historical session.
	PROCESS:
	The client sends a x25519 public key & a kyber public key.
	After the first packet is sent from the server the client & the server will generate a kyber shared secret based on the clients public kyber key.
	The server will encapsulate the shared secret with the client's public kyber key.
	The server will then send the encapsulated shared secret & a new ephemeral 25519 public key to the client
	The client then completes the new x25519 key exchange.
	The client will then use the new x25519 shared keys & the kyber shared secret
	The client will use the domain certificate's public kyber key to generate another shared secret.
	The client sends the encapsulated shared secret created from the kyber public key in the domain certificate to the server.
	The client and server then update their session keys with the new shared secrets.
	The session keys are hashed based on the prior session keys used initially.
 */
import { assign, isBuffer } from '@universalweb/acid';
import {
	clearBuffer,
	clearBuffers,
	randomBuffer,
	toBase64,
	toHex
} from '#crypto';
import kyber768_x25519 from '../keyExchange/kyber768_x25519.js';
import shake256 from '../hash/shake256.js';
import xChaCha from '../cipher/xChaCha.js';
export const x25519_kyber768_xchacha20 = {
	name: 'x25519_kyber768_xchacha20',
	alias: 'hpqt',
	description: 'Hybrid Post Quantum Key Exchange using both Crystals-Kyber768 + X25519 with XChaCha20 and SHAKE256.',
	id: 3,
	preferred: true,
	speed: 0,
	security: 1,
	keyExchange: kyber768_x25519,
	encryption: xChaCha,
	hash: shake256,
};
// copyright © Thomas Marchi
