import {
	assign,
	hasValue,
	isNotNumber,
	isTrue,
} from '@universalweb/utilitylib';
import { calculatePacketOverhead } from '#udsp/utilities/calculatePacketOverhead';
import { introHeaderRPC } from '#udsp/rpc/headerRPC';
import { introRPC } from '#udsp/rpc/frameRPC';
import { sendPacketIfAny } from '#udsp/utilities/sendPacket';
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
		connectionIdUndefined,
		rpc,
		cipherData,
		timeSent,
		// OPTIONAL DEFAULTS TO 0 or SERVEr PREFERRED
		cipherId,
		// OPTIONAL DEFAULTS TO CIPHERDATA SUBARRAY
		clientIdManual,
		// OPTIONAL DEFAULTS TO SERVERS
		version,
	] = header;
	const clientId = clientIdManual || Buffer.from(cipherData.subarray(0, 4));
	this.logInfo('Client initialize Packet Header', header);
	const { certificate } = this;
	if (cipherData) {
		this.logInfo(`cipherData in INTRO HEADER: ${toHex(cipherData)}`);
	} else {
		this.logInfo('No cipherData in INTRO HEADER');
		this.destroy();
		return false;
	}
	if (hasValue(cipherId)) {
		// TODO: CHANGE 3 TO MAX ID VALUE SAVED TO DEFAULTS FILE OR AUTO GENERATED ID
		if (isNotNumber(cipherId) || cipherId > 3 || cipherId < 0) {
			this.destroy();
			return false;
		}
	}
	this.cipher = certificate.getCipher(cipherId);
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
	if (this.keyExchange.onClientIntroHeader) {
		await this.keyExchange.onClientIntroHeader(this, this.destination, cipherData, header);
	}
	// TODO: CHECK CACHE OF VALUE
	await this.calculatePacketOverhead();
	this.nonce = await this.cipher.createNonce();
	this.logSuccess(`
		SCID = ${this.connectionIdString} | CCID = ${toHex(clientId)} | 
		ADDR = ${this.destination.ip}:${this.destination.port} 
		LATENCY = ${this.latency}`);
	if (packetDecoded.noFrame) {
		this.logInfo('Intro Packet has No Frame');
		if (this.keyExchange.onClientIntroHeaderNoFrame) {
			await this.keyExchange.onClientIntroHeaderNoFrame(this, this.destination, cipherData, header);
		}
		return this.sendIntro();
	}
}
// Intro is not triggered only header intro is
export async function intro(frame, header, rinfo) {
	this.logInfo(`Client Intro -> - ID:${this.connectionIdString}`);
	if (this.keyExchange.onClientIntro) {
		await this.keyExchange.onClientIntro(this, this.destination, frame, header);
	}
	return this.sendIntro();
}
// SERVER INTRO
export async function setIntroHeader(header) {
	header[0] = undefined;
	header[1] = introHeaderRPC;
	header[3] = this.id;
	header[4] = Date.now();
}
export async function setIntroFrame(frame) {
	frame[0] = false;
	frame[1] = introRPC;
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

