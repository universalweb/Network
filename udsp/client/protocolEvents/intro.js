import { isArray, isEmpty } from '@universalweb/acid';
import { clientStates } from '../../states.js';
import { introHeaderRPC } from '../../protocolHeaderRPCs.js';
import { toHex } from '#crypto';
const {
	inactiveState,
	discoveringState,
	discoveredState,
	connectingState,
	connectedState,
	closingState,
	closedState,
	destroyingState,
	destroyedState
} = clientStates;
export function checkIntroTimeout() {
	console.log('checkIntroTimeout', this.connected, this.introAttempts);
	if (this.connected === true) {
		return;
	} else if (this.introAttempts <= 3) {
		this.sendIntro();
	} else {
		this.close(`Failed to connect with ${this.introAttempts} attempts`);
	}
}
export function clearIntroTimeout() {
	clearTimeout(this.introTimeout);
	this.introTimeout = null;
}
export async function sendIntro() {
	console.log('Sending Intro');
	this.introAttempts++;
	this.introTimestamp = Date.now();
	await this.updateState(connectingState);
	const header = [introHeaderRPC];
	this.setPublicKeyHeader(header);
	this.setCryptographyHeaders(header);
	header.push(Date.now());
	if (this.realtime) {
		header.push(true);
	}
	this.introTimeout = setTimeout(() => {
		this.checkIntroTimeout();
	}, this.latency);
	await this.send(null, header);
}
export async function introHeader(header, packetDecoded, rinfo) {
	console.log('Client Intro Header', header);
	if (!header || !isArray(header) || isEmpty(header.length)) {
		this.close();
		return;
	}
	const rpc = header[1];
	const cipherData = header[2];
	// Change to own function call to handle introHeader cipherData
	if (cipherData) {
		await this.setSession(cipherData, null, header, packetDecoded);
	}
	// Consider change for how handshake is triggered maybe let cipher suite decide
	if (packetDecoded.noMessage) {
		if (this.cipherSuite.sendClientExtendedHandshakeHeader) {
			this.sendExtendedHandshakeHeader(this, this.destination, header, packetDecoded, rinfo);
		} else {
			this.handshaked();
		}
	}
}
export async function intro(frame, header, rinfo) {
	console.log('Got server Intro', frame);
	if (!frame || !isArray(frame)) {
		this.close(frame);
		return;
	}
	const { destination } = this;
	const [
		streamid_undefined,
		rpc,
		serverConnectionId,
		cipherData,
		changeDestinationAddress,
		serverRandomToken,
		upgradeToRealtime
	] = frame;
	this.destination.id = serverConnectionId;
	this.destination.connectionIdSize = serverConnectionId.length;
	if (cipherData) {
		console.log(this.destination.publicKey, cipherData);
		console.log('Server cipherData', toHex(cipherData));
		console.log('cipherData Provided Initiate New Session');
		await this.setSession(cipherData);
	}
	console.log('New Server Connection ID', toHex(serverConnectionId));
	if (changeDestinationAddress) {
		this.changeAddress(changeDestinationAddress, rinfo);
	}
	if (serverRandomToken) {
		this.serverRandomToken = serverRandomToken;
		console.log('Server Random Token', toHex(serverRandomToken));
	}
	if (upgradeToRealtime) {
		console.log('Upgrade to Realtime');
		this.realtime = true;
	}
	this.clearIntroTimeout();
	if (this.cipherSuite.sendClientExtendedHandshake) {
		this.sendExtendedHandshake(frame, header, rinfo);
		return;
	}
	this.handshaked();
}
