import { isArray, isEmpty } from '@universalweb/acid';
import { clientStates } from '../../states.js';
import { introHeaderRPC } from '../../protocolHeaderRPCs.js';
import { introRPC } from '../../protocolFrameRPCs.js';
import { sendPacketIfAny } from '#udsp/sendPacket';
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
	this.logInfo('checkIntroTimeout', this.connected, this.introAttempts);
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
// CONSIDER OPTIMIZATION TO CREATE CLIENT ID FROM CLIENT PUBLICKEY FREES UP A FEW BYTES FOR LARGE POST QUANTUM PUBLICKEYS
// COULD BE COMBINED WITH PORT NUMBER TO INCREASE LIKELIHOOD OF A UNIQUE ID
// PROS CONS OF GENERATING ID VS USING DEFINED AND SENT ONE
/*
const [
		connectionId,
		rpc,
		cipherData,
		clientId,
		cipherId,
		timeSent,
		version,
	] = header;
*/
export async function clientIntroHeader(header) {
	header[1] = introHeaderRPC;
	await this.setPublicKeyHeader(header);
	header[3] = this.id;
	header[4] = this.cipher.id;
	header[5] = Date.now();
	// ENSURE PROTOCOL VERSION IS SET & Being used here
	header[6] = this.version;
	// Try to avoid using version in packet unless in discovery attempts
	// Enforce using specific protocol Versions
	// If present only then consider using downgraded protocol version?
	// Creates a compatability mode for older clients but can't be relied upon
	// header.push(this.version);
}
export async function clientIntroFrame(frame) {
	frame[0] = false;
	frame[1] = introRPC;
	frame[2] = this.id;
}
export async function sendIntro() {
	this.logInfo('Sending Intro');
	const dateNow = Date.now();
	this.introAttempts++;
	this.introTimestamp = dateNow;
	await this.updateState(connectingState);
	const header = [];
	const frame = [];
	await this.clientIntroHeader(header);
	if (this.keyExchange.createClientIntro) {
		await this.keyExchange.createClientIntro(this, this.destination, frame, header);
	} else {
		header[1] = this.publicKeyBuffer || this.publicKey;
	}
	this.introTimeout = setTimeout(() => {
		this.checkIntroTimeout();
	}, this.latency);
	await this.sendAny(frame, header);
}
export async function introHeader(header, packetDecoded, rinfo) {
	this.logInfo('Client Intro Header', header);
	if (!header || !isArray(header) || isEmpty(header)) {
		this.close();
		return;
	}
	const rpc = header[1];
	const cipherData = header[2];
	// Change to own function call to handle introHeader cipherData
	if (cipherData) {
		await this.keyExchange.introHeader(this, this.destination, header, packetDecoded);
	}
	// Consider change for how handshake is triggered maybe let cipher suite decide
	if (packetDecoded.noMessage) {
		if (this.keyExchange.sendClientExtendedHandshakeHeader) {
			this.sendExtendedHandshakeHeader(this, this.destination, header, packetDecoded, rinfo);
		} else {
			this.handshaked();
		}
	}
}
// TODO: Make the cipherDATA in head only consider all data in header or no encrypted to reduce packet size
// Consider initial small connected IDs for extended Handshakes then on extended confirmation switch to larger
// Get sizes for full size of packets but for sure cant use encryption in intro for large publicKeys
// Validate can change origin IP address from server to client and router can handle it looks like it cant so must be changed
// Get ipv4 example working first with port change
// First packet would need to be sent via the originally sent IP & Port
// Dynamic Endpoint scaling with new IP and Port must be the default only proxy initial handshake packets at most see if room to change that.
// calculate new sizes new ipv6 is 16 bytes then another 2 for ports doesn't matter to encrypt it because its public anyway
// This gives us UDP hole punching for better scaling
// SWAP THIS TO JUST BE HEADERS ONLY IN PLAIN TEXT NO REASON FOR IT TO BE ENCRYPTED WILL FAIL TO CONNECT ANYWAY
export async function intro(frame, header, rinfo) {
	this.logInfo('Got server Intro', frame);
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
		serverRandomToken
	] = frame;
	this.destination.id = serverConnectionId;
	this.destination.connectionIdSize = serverConnectionId.length;
	// Change this so that there is a specific Function for the frame cipherData in the KeyExchange Object
	if (cipherData) {
		this.logInfo(this.destination.publicKey, cipherData);
		this.logInfo('Server cipherData', toHex(cipherData));
		this.logInfo('cipherData Provided Initiate New Session');
		await this.introCipherData(cipherData);
	}
	this.logInfo('New Server Connection ID', toHex(serverConnectionId));
	// TODO: REMOVE CHANGEADD AFTER NEW NETWORK STRATEGY FOR LOADBALANCING USE CONDITIONAL
	await this.changeAddress(changeDestinationAddress, rinfo);
	// if (changeDestinationAddress) {
	// 	this.changeAddress(changeDestinationAddress, rinfo);
	// }
	if (serverRandomToken) {
		this.serverRandomToken = serverRandomToken;
		this.logInfo('Server Random Token', toHex(serverRandomToken));
	}
	this.clearIntroTimeout();
	if (this.keyExchange.sendClientExtendedHandshake) {
		this.sendExtendedHandshake(frame, header, rinfo);
		return;
	}
	this.handshaked();
}
