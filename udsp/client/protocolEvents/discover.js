// ADD DISCOVERY AVAILABLE FOR DOMAIN CERTIFICATES
// DISCOURAGE DISCOVERY FOR PUBLIC CERTIFICATES FROM SERVERS
// ENCOURAGE DISCOVERY FOR PUBLIC CERTIFICATES FROM THE DOMAIN INFORMATION SYSTEM
import { clientStates } from '../../states.js';
import { discoveryHeaderRPC } from '../../protocolHeaderRPCs.js';
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
export async function setDiscoveryHeaders(header = []) {
	const key = this.publicKey;
	console.log('Setting DISCOVERY in UDSP Header', toHex(key));
	const {
		cipherSuiteName,
		cipherSuite,
		version,
		id
	} = this;
	header.push(id, cipherSuite.id, version);
	return header;
}
/*
		* Send Discovery
		* Generate & sign a random nonce include it in the header then send it to the server
		* Server verifies client most likely has the private key
		* sends cert chunked with one time encryption using client public key
		* Client saves cert and restarts the connection with the new data
	*/
export async function sendDiscovery() {
	if (this.state === inactiveState) {
		console.log('Sending Discovery');
		await this.updateState(discoveringState);
		const header = [discoveryHeaderRPC];
		this.setPublicKeyHeader(header);
		this.setCryptographyOptionsHeaders(header);
		const frame = [];
		this.discoverySent = true;
		return this.send(frame, header);
	}
}
export async function discovery(frame, header) {
	this.discovered();
}
export	async function discovered() {
	console.log('DISCOVERY COMPLETED -> CERTIFICATE LOADED');
	await this.updateState(discoveredState);
}
