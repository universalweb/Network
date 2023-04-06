import {
	success, failed, imported, msgSent, info, msgReceived
} from '../utilities/logs.js';
import {
	encode,
	decode
} from 'msgpackr';
import {
	decrypt,
	serverSession,
	signOpen,
	hash,
	signVerify,
	toBase64,
} from '../utilities/crypto.js';
import { createClient } from './createClient.js';
import { parsePacket } from './parsePacket.js';
// additionalData (ad) are the main UDSP headers. It may be called headers at times or additionalData.
export async function processSocket(server, connection, additionalDataBuffer, additionalData, packet) {
	const {
		profile: {
			ephemeral: {
				private: serverPrivateKey,
				key: serverPublicKey
			}
		},
	} = server;
	const signature = additionalData.sig;
	const ephemeralKeypair = additionalData.key;
	success(`Encrypted Message Signature: ${toBase64(signature)}`);
	success(`Encrypted Message Signature Size: ${signature.length}`);
	const clientId = additionalData.id;
	const nonce = additionalData.nonce;
	success(`Encrypted Message Size: ${packet.length}`);
	const sessionKey = serverSession(serverPublicKey, serverPrivateKey, ephemeralKeypair);
	const receiveKey = sessionKey.receiveKey;
	const transmitKey = sessionKey.transmitKey;
	success(`receiveKey: ${toBase64(receiveKey)}`);
	success(`transmitKey: ${toBase64(transmitKey)}`);
	console.log(toBase64(packet));
	console.log(toBase64(nonce));
	const decrypted = decrypt(packet, additionalDataBuffer, nonce, receiveKey);
	if (!decrypted) {
		return failed(`Decrypt Failed`);
	}
	success(`Decrypted`);
	if (decrypted) {
		const message = parsePacket(server, decrypted);
		if (!message) {
			return failed('JSON ERROR', connection);
		}
		server.socketCount++;
		console.log(message);
		const isValid = signVerify(signature, message.head.cert.key);
		console.log('SIGNATURE CHECK', isValid);
		if (!isValid) {
			return failed(`Signature isn't valid`);
		}
		const signatureHash = signOpen(signature, message.head.cert.key);
		const sigCompare = Buffer.compare(signatureHash, hash(ephemeralKeypair)) === 0;
		if (sigCompare) {
			msgReceived(`Signature is valid`);
			const client = await createClient(server, connection, receiveKey, transmitKey, clientId);
			await server.api.onMessage(client, message);
		} else {
			console.log('SIGNATURE FAILED NO SOCKET CREATED');
			return;
		}
		success(`Messages Received: ${server.socketCount}`);
	}
}
