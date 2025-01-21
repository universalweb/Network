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
import * as defaultCrypto from '#crypto';
import { assign, clear, isBuffer } from '@universalweb/acid';
import {
	decapsulate,
	encapsulate,
	encryptionKeypair,
	kyber768
} from '../keyExchange/kyber768.js';
import { decrypt, encrypt, encryptionOverhead } from '../encryption/XChaCha.js';
import { extendedHandshakeHeaderRPC, introHeaderRPC } from '../../udsp/protocolHeaderRPCs.js';
import { extendedHandshakeRPC, introRPC } from '../../udsp/protocolFrameRPCs.js';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { shake256 } from '@noble/hashes/sha3';
const {
	randomBuffer,
	toBase64,
	toHex,
	combineKeysSHAKE256,
	shake254_512,
	clearBuffer,
	clearBuffers,
	expandIntoSessionKeys
} = defaultCrypto;
const { id: encryptionKeypairID, } = kyber768;
const hashFunction = shake254_512;
export const kyber768_xChaCha = {
	name: 'kyber768_xChaCha',
	alias: 'kyber768',
	description: 'Crystals-Kyber768 with XChaCha20 and SHAKE256.',
	id: 2,
	preferred: true,
	speed: 0,
	security: 1,
	async clientEphemeralKeypair() {
		const source = await kyber768_xChaCha.keypair();
		return source;
	},
	async clientInitializeSession(source, destination) {
		console.log('clientInitializeSession Destination', destination);
		console.log('Public Key from destination', destination.publicKey[0]);
	},
	async clientSetSession(source, destination, cipherData) {
		const kyberPrivateKey = source.privateKey;
		const sharedSecret = await decapsulate(cipherData, kyberPrivateKey);
		console.log('clientSetSession kyberSharedSecret', sharedSecret[0], sharedSecret.length);
		expandIntoSessionKeys(sharedSecret, source);
		console.log('New Session Keys', source.transmitKey[0], source.receiveKey[0]);
	},
	async sendClientExtendedHandshake(source, destination, frame, header) {
		const destinationPublicKey = destination.publicKey;
		console.log('TRIGGERED sendClientExtendedHandshake');
		console.log(destinationPublicKey.length);
		const {
			cipherText,
			sharedSecret
		} = await encapsulate(destinationPublicKey);
		frame.push(cipherText);
		source.cipherData = cipherText;
		source.sharedSecret = sharedSecret;
		console.log('sendClientExtendedHandshake kyberSharedSecret', sharedSecret[0], sharedSecret.length);
		console.log('sendClientExtendedHandshake cipherText', cipherText[0], cipherText.length);
	},
	async clientExtendedHandshake(source, destination) {
		console.log('TRIGGERED client ExtendedHandshake', source.transmitKey, source.sharedSecret);
		const sharedSecret = source.sharedSecret;
		const oldTransmitKey = source.transmitKey;
		const oldReceiveKey = source.receiveKey;
		source.transmitKey = combineKeysSHAKE256(oldTransmitKey, source.sharedSecret);
		source.receiveKey = combineKeysSHAKE256(oldReceiveKey, source.sharedSecret);
		clearBuffer(oldTransmitKey);
		clearBuffer(oldReceiveKey);
		clearBuffer(source.sharedSecret);
		clearBuffer(source.cipherData);
		source.sharedSecret = null;
		source.cipherData = null;
		console.log('TRIGGERED client ExtendedHandshake', source.transmitKey);
	},
	async serverInitializeSession(source, destination, destinationPublicKey) {
		console.log('server InitializeSession');
		console.log(destinationPublicKey);
		const {
			cipherText,
			sharedSecret
		} = await encapsulate(destinationPublicKey);
		destination.publicKey = destinationPublicKey;
		source.cipherData = cipherText;
		expandIntoSessionKeys(sharedSecret, source);
		console.log('server kyberSharedSecret', sharedSecret[0], sharedSecret.length);
		console.log('destinationPublicKey', destinationPublicKey[0]);
	},
	async sendServerIntro(source, destination, frame, header) {
		console.log('Send Server Intro', source.cipherData);
		header[0] = introHeaderRPC;
		header[1] = source.cipherData;
	},
	async serverExtendedHandshake(source, destination, frame, header) {
		console.log('serverExtendedHandshake CIPHER CALLED', frame, header);
		const [
			streamid_undefined,
			rpc,
			cipherData
		] = frame;
		const privateKey = source.privateKey;
		const sharedSecret = await decapsulate(cipherData, privateKey);
		clearBuffer(cipherData);
		source.cipherData = null;
		source.sharedSecret = sharedSecret;
		source.nextSession = true;
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
		console.log('sharedSecret', source.sharedSecret[0]);
		console.log('server cipherText', cipherData[0], cipherData.length);
	},
	async sendServerExtendedHandshake(source, destination) {
		console.log('Server Extended Handshake ack');
		// Should be able to remove this
		// const frame = [
		// 	false,
		// 	extendedHandshakeRPC,
		// ];
		// return frame;
	},
	async serverSetSession(source, destination) {
		console.log('serverSetSession');
		const sharedSecret = source.sharedSecret;
		const oldTransmitKey = source.transmitKey;
		const oldReceiveKey = source.receiveKey;
		source.transmitKey = combineKeysSHAKE256(oldTransmitKey, source.sharedSecret);
		source.receiveKey = combineKeysSHAKE256(oldReceiveKey, source.sharedSecret);
		clearBuffer(oldTransmitKey);
		clearBuffer(oldReceiveKey);
		clearBuffer(source.sharedSecret);
		source.sharedSecret = null;
		source.nextSession = null;
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
	},
	generateSeed() {
		return randomBuffer(64);
	},
	async keypair(kyberSeed) {
		const target = await encryptionKeypair(kyberSeed);
		return target;
	},
	async certificateEncryptionKeypair() {
		const target = await encryptionKeypair();
		return target;
	},
	decrypt,
	encrypt,
	ml_kem768,
	hash: hashFunction,
	extendedHandshake: true,
	encryptionKeypairID,
	encryptionOverhead
};
// copyright © Thomas Marchi
