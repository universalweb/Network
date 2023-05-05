import {
	success, failed, imported, msgSent, info
} from '#logs';
import { buildPacketSize } from '#utilities/buildPacketSize';
import { buildStringSize } from '#utilities/buildStringSize';
import {
	encode,
	decode
} from 'msgpackr';
import { promise } from 'Acid';
import {
	encrypt,
	nonceBox,
	toBase64,
	hashSign,
	encryptABytes
} from '#crypto';
imported('Client Send');
export async function send(message, priority) {
	if (priority) {
		console.log(`Priority: ${priority}`);
	}
	const thisContext = this;
	const {
		server,
		ip,
		port,
	} = thisContext;
	const headers = {};
	const clientStatusCode = thisContext.state;
	console.log(`client Status Code is ${clientStatusCode}`);
	info(`Send to server`);
	const nonce = nonceBox();
	success(`Nonce Size: ${nonce.length} ${toBase64(nonce)}`);
	const transmitID = thisContext.serverId || thisContext.clientId;
	if (transmitID) {
		headers.id = transmitID;
	} else {
		return console.error(`CLIENT ID IS'T ASSIGNED`);
	}
	headers.nonce = nonce;
	if (clientStatusCode === 0) {
		// PERFECT FORWARD SECRECY USE RANDOM EPHEMERAL KEY TO ENCRYPT
		headers.key = thisContext.keypair.publicKey;
		const profileKeypairSignature = hashSign(headers.key, thisContext.profile.ephemeral.private);
		message.sig = profileKeypairSignature;
		message.idc = thisContext.ephemeralPublic;
		console.log(`Sig Size:${message.sig.length}`);
		console.log(`Setting ephemeral random public key to header & profile cert to message.body`);
	}
	console.log('PACKET HEADERS', headers);
	if (message.head) {
		message.head = encode(message.head);
	}
	if (message.body) {
		message.body = encode(message.body);
	}
	const headersEncoded = encode(headers);
	console.log(headers);
	success(`Additional Data Headers Encoded Size ${headersEncoded.length}`);
	console.log('TransmitKey', toBase64(thisContext.transmitKey));
	console.log(message);
	const messageEncoded = encode(message);
	const encryptedMessage = encrypt(messageEncoded, headersEncoded, nonce, thisContext.transmitKey);
	if (!encryptedMessage) {
		return failed('Encryption failed');
	}
	success(`Encrypted Message Size:${encryptedMessage.length}`);
	const encryptedMessageLength = encryptedMessage.length;
	const compactedMessage = encode([headersEncoded, encryptedMessage]);
	const packetSize = compactedMessage.length;
	success(`Packet End Index ${packetSize}`);
	if (packetSize >= 1280) {
		console.log(compactedMessage);
		failed(`WARNING: Packet size is larger than max allowed size -> ${packetSize}`);
	}
	return promise((accept, reject) => {
		server.send(compactedMessage, port, ip, (error) => {
			if (error) {
				failed(error);
				return reject(error);
			}
			msgSent(compactedMessage);
			accept();
		});
	});
}
