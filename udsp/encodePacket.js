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
	omit
} from 'Acid';
import {
	encrypt,
	nonceBox,
	toBase64,
	hashSign
} from '#crypto';
export async function encodePacket(data) {
	const {
		nonce: nonceBuffer,
		transmitKey,
		id,
		state,
		options,
		message,
		headers = {},
		footer,
		client,
		keypair,
		profile,
		ephemeralPublic
	} = data;
	const nonce = nonceBox(nonceBuffer);
	if (id) {
		headers.id = id;
	} else {
		return console.error(`ID IS'T ASSIGNED`);
	}
	headers.nonce = nonce;
	message.time = Date.now();
	if (client) {
		if (state === 0) {
			headers.key = keypair.publicKey;
			const profileKeypairSignature = hashSign(headers.key, profile.ephemeral.private);
			message.sig = profileKeypairSignature;
			message.idc = ephemeralPublic;
			console.log(`Sig Size:${message.sig.length}`);
			console.log(`Setting ephemeral random public key to header & profile cert to message.body`);
		}
	}
	success(`PROCESSING MESSAGE TO SEND`);
	if (options) {
		console.log('Packet Options', options);
	}
	if (message.head) {
		message.head = encode(message.head);
		success('head PAYLOAD', message.head.length);
	}
	if (message.body) {
		message.body = encode(message.body);
		success('body PAYLOAD', message.body.length);
	}
	const headersEncoded = encode(headers);
	const messageEncoded = encode(message);
	const ad = (footer) ? Buffer.concat(headersEncoded, footer) : headersEncoded;
	const encryptedMessage = encrypt(messageEncoded, ad, nonce, transmitKey);
	if (!encryptedMessage) {
		return failed('Encryption failed');
	}
	const packet = encode([headersEncoded, encryptedMessage]);
	if (footer) {
		packet[2] = encode(footer);
	}
	info('Raw Message', message);
	info(`clientId: ${headers.id}`);
	info(`Transmit Key ${toBase64(transmitKey)}`);
	info(`Nonce Size: ${headers.nonce.length} ${toBase64(headers.nonce)}`);
	const packetSize = packet.length;
	success(`Packet Size ${packetSize}`);
	if (packetSize >= 1280) {
		console.log(packet);
		failed(`WARNING: Packet size is larger than max allowed size 1280 -> ${packetSize} over by ${packetSize - 1280}`);
	}
	return packet;
}
