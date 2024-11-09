import {
	assign, hasValue, isNotNumber, isTrue
} from '@universalweb/acid';
import { info, success } from '#logs';
import { calculatePacketOverhead } from '#udsp/calculatePacketOverhead';
import { introRPC } from '../../../protocolFrameRPCs.js';
import { toHex } from '#crypto';
// CLIENT HELLO
// Change from initialization to this for session stuff keep separate
export async function introHeader(header, packetDecoded) {
	info(`Client Intro -> - ID:${this.connectionIdString}`);
	const [
		connectionId,
		rpc,
		cipherData,
		clientId,
		cipherSuiteId,
		version,
		timeSent,
		realtimeFlag,
	] = header;
	console.log('Client initialize Packet Header', header);
	if (cipherData) {
		success(`cipherData in INTRO HEADER: ${toHex(cipherData)}`);
	}
	const { certificate } = this;
	if (hasValue(cipherSuiteId)) {
		if (isNotNumber(cipherSuiteId) || cipherSuiteId > 99 || cipherSuiteId < 0) {
			this.destroy();
			return false;
		}
	}
	this.cipherSuite = certificate.getCipherSuite(cipherSuiteId);
	if (!this.cipherSuite) {
		this.destroy();
		return false;
	}
	assign(this.destination, {
		id: clientId,
		connectionIdSize: clientId.length,
	});
	this.latency = Date.now() - timeSent;
	success(`SCID = ${this.connectionIdString} | CCID = ${toHex(clientId)} | ADDR = ${this.destination.ip}:${this.destination.port} LATENCY = ${this.latency}`);
	await this.initializeSession(cipherData);
	await this.calculatePacketOverhead();
	if (realtimeFlag === false) {
		this.realtime = false;
	}
	if (packetDecoded.noMessage) {
		console.log('Intro Packet has No message body');
		return this.sendIntro();
	}
}
export async function intro(frame, header, rinfo) {
	info(`Client Intro -> - ID:${this.connectionIdString}`);
	return this.sendIntro();
}
// SERVER HELLO
export async function sendIntro() {
	const header = [];
	const frame = [
		false,
		introRPC,
		this.id
	];
	await this.cipherSuite.sendServerIntro(this, this.destination, frame, header);
	// Change connection IP:Port to be the workers IP:Port
	const scale = this.scale;
	if (scale) {
		const changeAddress = scale.changeAddress;
		if (isTrue(changeAddress)) {
			frame[4] = true;
		}
	}
	console.log('Sending Server Intro', frame, header);
	// this.randomId
	this.updateState(1);
	if (header.length === 0) {
		return this.send(frame);
	} else if (frame.length === 0) {
		return this.send(null, header);
	} else {
		return this.send(frame, header);
	}
}
