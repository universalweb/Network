import {
	assign,
	hasValue,
	isNotNumber,
	isTrue
} from '@universalweb/acid';
import { calculatePacketOverhead } from '#udsp/calculatePacketOverhead';
import { introHeaderRPC } from '../../../protocolHeaderRPCs.js';
import { introRPC } from '../../../protocolFrameRPCs.js';
import { sendPacketIfAny } from '#udsp/sendPacket';
import { toHex } from '#utilities/cryptography/utils';
async function certificateKeypairCompatability(source, destination, header, frame) {
	if (source.cipher?.certificateKeypairCompatabilityServer) {
		await source.cipher?.certificateKeypairCompatabilityServer(source, source, destination, header, frame);
	}
}
// CLIENT HELLO
// Change from initialization to this for session stuff keep separate
export async function introHeader(header, packetDecoded) {
	this.logInfo(`Client Intro -> - ID:${this.connectionIdString}`);
	const [
		connectionId,
		rpc,
		cipherData,
		clientId,
		cipherId,
		timeSent,
		// version,
	] = header;
	this.logInfo('Client initialize Packet Header', header);
	const { certificate } = this;
	if (cipherData) {
		this.logSuccess(`cipherData in INTRO HEADER: ${toHex(cipherData)}`);
	} else {
		this.logInfo('No cipherData in INTRO HEADER');
		this.destroy();
		return false;
	}
	if (hasValue(cipherId)) {
		if (isNotNumber(cipherId) || cipherId > 3 || cipherId < 0) {
			this.destroy();
			return false;
		}
	}
	this.cipher = certificate.getCipherSuite(cipherId);
	if (!this.cipher) {
		await this.destroy();
		return false;
	}
	assign(this.destination, {
		id: clientId,
		connectionIdSize: clientId.length,
	});
	if (timeSent) {
		this.latency = Date.now() - timeSent;
	}
	await certificateKeypairCompatability(this, this.destination, header);
	await this.initializeSession(cipherData);
	await this.calculatePacketOverhead();
	this.nonce = await this.cipher.createNonce();
	this.logSuccess(`SCID = ${this.connectionIdString} | CCID = ${toHex(clientId)} | ADDR = ${this.destination.ip}:${this.destination.port} LATENCY = ${this.latency}`);
	if (packetDecoded.noMessage) {
		this.logInfo('Intro Packet has No message body');
		return this.sendIntro();
	}
}
// Intro is not triggered only header intro is
export async function intro(frame, header, rinfo) {
	this.logInfo(`Client Intro -> - ID:${this.connectionIdString}`);
	return this.sendIntro();
}
// SERVER INTRO
// Intro in plain text is fine because data is just to establish a connection if contents are modified then an encrypted synchronization will fail at one point or another
/* const [
		streamid_undefined,
		rpc,
		serverConnectionId,
		cipherData,
		changeDestinationAddress,
		serverRandomToken
	] = frame;
*/
export async function setIntroHeader(header) {
	header[1] = introHeaderRPC;
	header[2] = this.id;
}
export async function setIntroFrame(frame) {
	frame[0] = false;
	frame[1] = introRPC;
	frame[2] = this.id;
}
export async function createIntro(header, frame) {
	await this.setIntroHeader(header);
	await this.attachProxyAddress(header);
	if (this.keyExchange.createServerIntro) {
		await this.keyExchange.createServerIntro(this, this.destination, frame, header);
	}
}
// Add timeout to check if client is still connected
export async function sendIntro() {
	const header = [];
	const frame = [];
	this.logInfo('Sending Server Intro', frame, header);
	await this.createIntro(header, frame);
	await this.setState(1);
	return this.sendAny(frame, header);
}

