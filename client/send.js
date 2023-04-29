import {
	success, failed, imported, msgSent, info
} from '#logs';
import { buildPacketSize } from '#utilities/buildPacketSize.js';
import { buildStringSize } from '#utilities/buildStringSize.js';
import {
	encode,
	decode
} from 'msgpackr';
import { promise } from 'Acid';
import {
	encrypt,
	nonceBox,
	toBase64,
	hashSign
} from '#crypto';
imported('Client Send');
export async function send(message, priority) {
	console.log(`Priority: ${priority}`);
	const thisContext = this;
	const {
		server,
		ip,
		port,
	} = thisContext;
	const headers = {};
	const clientStatusCode = thisContext.state;
	console.log(`client Status Code is ${clientStatusCode}`);
	if (clientStatusCode === 0) {
		if (!message.head) {
			message.head = {};
		}
		message.head.cert = thisContext.ephemeralPublic;
	}
	if (message.head) {
		message.head = encode(message.head);
	}
	if (message.body) {
		message.body = encode(message.body);
	}
	info(`Send to server`);
	const nonce = nonceBox();
	success(`Nonce Size: ${nonce.length} ${toBase64(nonce)}`);
	const transmitID = thisContext.serverId || thisContext.clientId;
	if (transmitID) {
		headers.id = transmitID;
	} else {
		return console.error(`NO CLIENT ID IS'T ASSIGNED`);
	}
	headers.nonce = nonce;
	if (clientStatusCode === 0) {
		// PERFECT FORWARD SECRECY USE RANDOM EPHEMERAL KEY TO ENCRYPT IDENTITY CERT
		headers.key = thisContext.keypair.publicKey;
		headers.sig = hashSign(headers.key, thisContext.profile.ephemeral.private);
		console.log(`Sig:${toBase64(headers.sig)}`);
		console.log(`Sig Size:${headers.sig.length}`);
		console.log(`Setting ephemeral random public key to header & profile cert to message.body`);
	}
	console.log('PACKET HEADERS', headers);
	const headersEncoded = encode(headers);
	const headersEndIndex = headersEncoded.length + 3;
	const headersEndIndexBuffer = buildStringSize(headersEndIndex);
	console.log(headersEndIndex, headers);
	const headersCompiled = Buffer.concat([headersEndIndexBuffer, headersEncoded]);
	success(`Additional Data End Index ${headersEndIndex.toString()}`);
	console.log(toBase64(thisContext.transmitKey));
	console.log(message);
	const messageEncoded = encode(message);
	const encryptedMessage = encrypt(messageEncoded, headersEncoded, nonce, thisContext.transmitKey);
	if (!encryptedMessage) {
		return failed('Encryption failed');
	}
	success(`Encrypted Message Size:${encryptedMessage.length} -> ${toBase64(encryptedMessage)}`);
	const encryptedLength = encryptedMessage.length;
	const encryptedDataEndIndex = buildPacketSize(headersEndIndex + 4 + encryptedLength);
	success(`Encrypted Data End Index: ${encryptedDataEndIndex.toString()}`);
	const messageBuffer = Buffer.concat([
		headersCompiled,
		encryptedDataEndIndex,
		encryptedMessage,
	]);
	console.log(toBase64(encryptedMessage));
	const packetSize = messageBuffer.length;
	success(`Packet End Index ${packetSize}`);
	success('Message Buffer Size', Buffer.from(messageBuffer).length);
	if (packetSize >= 1280) {
		console.log(messageBuffer);
		failed(`WARNING: Packet size is larger than max allowed size -> ${packetSize}`);
	}
	return promise((accept, reject) => {
		server.send(messageBuffer, port, ip, (error) => {
			if (error) {
				failed(error);
				return reject(error);
			}
			msgSent(messageBuffer);
			accept();
		});
	});
}
