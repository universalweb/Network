import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import {
	encode,
	decode
} from 'msgpackr';
import {
	decrypt, sessionKeys, signOpen, hash, signVerifyHash, toBase64, boxUnseal
} from '#crypto';
import { createClient } from './createClient.js';
import { processPacketEvent } from './processPacketEvent.js';
// headers (ad) are the main UDSP headers. It may be called headers at times or headers.
export async function processSocket(server, connection, headersBuffer, headers, messageBuffer) {
	const {
		profile: {
			ephemeral: {
				private: serverPrivateKey,
				key: serverPublicKey
			}
		},
	} = server;
	if (headers.key) {
		console.log('HEADERS SEALED', headers);
		console.log(serverPublicKey);
		const unsealedKey = boxUnseal(headers.key, serverPublicKey, serverPrivateKey);
		console.log(headers.key, '\n', serverPublicKey, '\n', serverPrivateKey);
		if (!unsealedKey) {
			return new Error('UNSEALED KEY BROKEN');
		}
		headers.key = unsealedKey;
	}
	const ephemeralKeypair = headers.key;
	const clientId = headers.id;
	const nonce = headers.nonce;
	success(`Encrypted Message Size: ${messageBuffer.length}`);
	const sessionKey = sessionKeys(serverPublicKey, serverPrivateKey, ephemeralKeypair);
	const receiveKey = sessionKey.receiveKey;
	const transmitKey = sessionKey.transmitKey;
	info(`receiveKey: ${toBase64(receiveKey)}`);
	info(`transmitKey: ${toBase64(transmitKey)}`);
	console.log(toBase64(messageBuffer));
	console.log(toBase64(nonce));
	console.log(headersBuffer.length);
	const decrypted = decrypt(messageBuffer, headersBuffer, nonce, receiveKey);
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
		const destination = {
			publicKey: ephemeralKeypair
		};
		const sigVerify = signVerifyHash(sig, Buffer.concat([nonce, ephemeralKeypair]), idc.key);
		console.log('Concat Sig', Buffer.concat([nonce, ephemeralKeypair]));
		console.log('SIGNature Hash', sig);
		console.log('Ephemeral Key', ephemeralKeypair);
		if (sigVerify) {
			msgReceived(`Signature is valid`);
			const client = await createClient(server, connection, receiveKey, transmitKey, destination, clientId);
			console.log(client);
			await processPacketEvent(server, client, message);
		} else {
			console.log('SIGNATURE FAILED NO SOCKET CREATED', sigVerify);
			return;
		}
		success(`Socket Count: ${server.socketCount}`);
	}
}
