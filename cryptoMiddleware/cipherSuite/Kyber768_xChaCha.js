// Closed source not for private and or corporate use.
// KYBER KEY EXCHANGE WITH BUILT IN DOMAIN CERTIFICATE & SERVER AUTHENTICATION WITH Perfect Forward Secrecy
/*
	Create User Kyber keypair send to server
	Server creates Kyber shared Secret & encapsulates it via user's public kyber key
	Server sends cipher text in the header & encrypted intro frame to the user
	Server sets the session with the new secret keys
	User first decapsulates ciphertext with user's private kyber key located in the header
	User then sets the session with the new secret keys
	Make sure to create a transmit and receive keys so both are unique to add an extra layer of security
*/
import { assign, clear, isBuffer } from '@universalweb/acid';
import {
	clearBuffer,
	clearBuffers,
	randomBuffer,
	toBase64,
	toHex
} from '#crypto';
import kyber768 from '../keyExchange/kyber768.js';
import xChaCha from '../encryption/XChaCha.js';
const hash256 = kyber768.hash;
export const kyber768_xChaCha = {
	name: 'kyber768_xChaCha',
	alias: 'kyber768',
	description: 'Crystals-Kyber768 with XChaCha20 and SHAKE256.',
	id: 2,
	preferred: true,
	speed: 0,
	security: 1,
	encryption: xChaCha,
	keyExchange: kyber768,
	hash: hash256,
	extendedHandshake: true,
};
// copyright © Thomas Marchi
