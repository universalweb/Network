import {
	clearBuffer,
	int32,
	int64,
	randomBuffer
} from '#crypto';
import { combineKeys, expandIntoSessionKeys, hash256 } from '../hash/shake256.js';
import { introHeaderRPC } from '../../udsp/protocolHeaderRPCs.js';
import { isBuffer } from '@universalweb/acid';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
const publicKeySize = 1184;
const privateKeySize = 2400;
const seedSize = int64;
const hash512Settings = {
	dkLen: 64
};
export async function encryptionKeypair(seed) {
	const kyberKeypair = ml_kem768.keygen(seed);
	return {
		publicKey: kyberKeypair.publicKey,
		privateKey: kyberKeypair.secretKey
	};
}
export async function decapsulate(cipherData, sourceKeypairKyber) {
	const decapsulated = ml_kem768.decapsulate(cipherData, sourceKeypairKyber?.privateKey || sourceKeypairKyber);
	return decapsulated;
}
export async function encapsulate(sourceKeypair) {
	// { cipherText, sharedSecret }
	const encapsulated = ml_kem768.encapsulate(sourceKeypair?.publicKey || sourceKeypair);
	return encapsulated;
}
export const kyber768 = {
	name: 'kyber768',
	alias: 'kyber768',
	id: 1,
	preferred: true,
	async clientEphemeralKeypair() {
		const source = await encryptionKeypair();
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
		await expandIntoSessionKeys(sharedSecret, source);
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
		source.transmitKey = await combineKeys(oldTransmitKey, source.sharedSecret);
		source.receiveKey = await combineKeys(oldReceiveKey, source.sharedSecret);
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
		await expandIntoSessionKeys(sharedSecret, source);
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
	},
	async serverSetSession(source, destination) {
		console.log('serverSetSession');
		const sharedSecret = source.sharedSecret;
		const oldTransmitKey = source.transmitKey;
		const oldReceiveKey = source.receiveKey;
		source.transmitKey = await combineKeys(oldTransmitKey, source.sharedSecret);
		source.receiveKey = await combineKeys(oldReceiveKey, source.sharedSecret);
		clearBuffer(oldTransmitKey);
		clearBuffer(oldReceiveKey);
		clearBuffer(source.sharedSecret);
		source.sharedSecret = null;
		source.nextSession = null;
		console.log('Keys', source.transmitKey[0], source.receiveKey[0]);
	},
	publicKeySize,
	privateKeySize,
	clientPublicKeySize: publicKeySize,
	clientPrivateKeySize: privateKeySize,
	serverPublicKeySize: publicKeySize,
	serverPrivateKeySize: privateKeySize,
	decapsulate,
	encapsulate,
	generateSeed() {
		return randomBuffer(seedSize);
	},
	encryptionKeypair,
	certificateEncryptionKeypair: encryptionKeypair,
};
export default kyber768;
// const keypair = await encryptionKeypair();
// console.log(keypair);
// console.log(keypair.privateKey.length);
// console.log(await encapsulate(keypair));
