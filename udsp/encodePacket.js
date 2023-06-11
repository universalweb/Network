import {
	success, failed, imported, msgSent, info
} from '#logs';
import {
	encode,
	decode
} from 'msgpackr';
import {
	assign,
	chunk,
	omit,
	objectSize
} from '@universalweb/acid';
import {
	encrypt,
	nonceBox,
	randomize,
	toBase64,
	signDetached,
	boxSeal,
} from '#crypto';
export async function encodePacket(config) {
	success(`PROCESSING ENCODE PACKET`);
	const {
		source,
		packet: {
			headers = {},
			message,
			footer,
			options
		}
	} = config;
	const {
		state,
		isClient,
		isServer,
		isServerClient
	} = source;
	const destination = source.destination || config.destination;
	let id = destination.id || source.id;
	const encryptConnectionId = (isServer || isServerClient) ? source.encryptConnectionId : destination.encryptConnectionId;
	if (!id) {
		return console.error(`ID IS'T ASSIGNED`);
	}
	if (encryptConnectionId) {
		id = boxSeal(id, destination.encryptKeypair);
	}
	headers.id = id;
	message.t = Date.now();
	if (isClient) {
		if (state === 0) {
			console.log('DESTINATION ENCRYPT PUBLIC KEY', toBase64(destination.encryptKeypair.publicKey));
			headers.key = boxSeal(source.keypair.publicKey, destination.encryptKeypair);
		}
	}
	if (options) {
		console.log('Packet Options', options);
	}
	const headersEncoded = (objectSize(headers) === 1 && headers.id) ? encode(id) : encode(headers);
	const messageEncoded = encode(message);
	const ad = (footer) ? Buffer.concat([headersEncoded, footer]) : headersEncoded;
	const encryptedMessage = encrypt(messageEncoded, source.sessionKeys, ad);
	if (!encryptedMessage) {
		return failed('Encryption failed');
	}
	const packet = encode([headersEncoded, encryptedMessage]);
	if (footer) {
		packet[2] = encode(footer);
	}
	info(`clientId: ${toBase64(headers.id)}`);
	info(`Transmit Key ${toBase64(source.sessionKeys.transmitKey)}`);
	const packetSize = packet.length;
	info(`encoded Packet Size ${packetSize}`);
	if (packetSize >= 1280) {
		console.log(packet);
		failed(`WARNING: Packet size is larger than max allowed size 1280 -> ${packetSize} over by ${packetSize - 1280}`);
	}
	success(`PROCESSED ENCODE PACKET`);
	return packet;
}
