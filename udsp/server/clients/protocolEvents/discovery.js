import { discoveryHeaderRPC } from '../../../protocolHeaderRPCs.js';
import { info } from '#logs';
// CLIENT DISCOVERY
export	async function discovery(frame, header) {
	info(`Client Discovery -> - ID:${this.connectionIdString}`, frame, header);
	return this.sendDiscovery(frame, header);
}
// SERVER DISCOVERY
export	async function sendDiscovery() {
	const header = [
		false,
		discoveryHeaderRPC,
		this.id,
	];
	this.updateState(1);
	await this.send(null, header);
}
