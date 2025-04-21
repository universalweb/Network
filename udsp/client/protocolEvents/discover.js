// ADD DISCOVERY AVAILABLE FOR DOMAIN CERTIFICATES
// DISCOURAGE DISCOVERY FOR PUBLIC CERTIFICATES FROM SERVERS
// ENCOURAGE DISCOVERY FOR PUBLIC CERTIFICATES FROM THE DOMAIN INFORMATION SYSTEM
import { clientStates } from '../defaults.js';
import { discoveryHeaderRPC } from '../../protocolHeaderRPCs.js';
import { toHex } from '#utilities/cryptography/utils';
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
	this.logInfo('Setting DISCOVERY in UDSP Header', toHex(key));
	const {
		cipherName,
		cipher,
		version,
		id
	} = this;
	header.push(id, cipher.id, version);
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
		this.logInfo('Sending Discovery');
		await this.setState(discoveringState);
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
	this.logInfo('DISCOVERY COMPLETED -> CERTIFICATE LOADED');
	await this.setState(discoveredState);
}
