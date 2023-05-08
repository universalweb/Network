import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
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
} from '#crypto';
import { createClient } from './createClient.js';
import { processPacketEvent } from './processPacketEvent.js';
// additionalData (ad) are the main UDSP headers. It may be called headers at times or additionalData.
export async function processSocket(server, connection, additionalDataBuffer, additionalData, messageBuffer) {
	const {
		profile: {
			ephemeral: {
				private: serverPrivateKey,
				key: serverPublicKey
			}
		},
	} = server;
	const ephemeralKeypair = additionalData.key;
	const clientId = additionalData.id;
	const nonce = additionalData.nonce;
	success(`Encrypted Message Size: ${messageBuffer.length}`);
	const sessionKey = serverSession(serverPublicKey, serverPrivateKey, ephemeralKeypair);
	const receiveKey = sessionKey.receiveKey;
	const transmitKey = sessionKey.transmitKey;
	info(`receiveKey: ${toBase64(receiveKey)}`);
	info(`transmitKey: ${toBase64(transmitKey)}`);
	console.log(toBase64(messageBuffer));
	console.log(toBase64(nonce));
	console.log(additionalDataBuffer.length);
	const decrypted = decrypt(messageBuffer, additionalDataBuffer, nonce, receiveKey);
	if (!decrypted) {
		return failed(`Decrypt Failed`);
	}
	success(`Decrypted`);
	if (decrypted) {
		const message = decode(decrypted);
		if (!message) {
			return failed('MSGPACK ERROR', connection);
		}
		console.log(message);
		if (!message.idc) {
			return failed('No Identity Provided', connection);
		}
		if (!message.sig) {
			return failed('No Sig Provided', connection);
		}
		const {
			idc,
			sig
		} = message;
		server.socketCount++;
		console.log(message);
		success(`Encrypted Message Signature: ${toBase64(sig)}`);
		success(`Encrypted Message Signature Size: ${sig.length}`);
		const isValid = signVerify(sig, idc.key);
		console.log('SIGNATURE CHECK', isValid);
		if (!isValid) {
			return failed(`Signature isn't valid`);
		}
		const signatureHash = signOpen(sig, idc.key);
		if (!signatureHash) {
			return failed(`Signature open failed`);
		}
		const sigCompare = Buffer.compare(signatureHash, hash(ephemeralKeypair)) === 0;
		if (sigCompare) {
			msgReceived(`Signature is valid`);
			const client = await createClient(server, connection, receiveKey, transmitKey, clientId);
			console.log(client);
			await processPacketEvent(server, client, message);
		} else {
			console.log('SIGNATURE FAILED NO SOCKET CREATED');
			return;
		}
		success(`Socket Count: ${server.socketCount}`);
	}
}
