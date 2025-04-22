import { discoveryHeaderRPC } from '../../../rpc/headerRPC.js';
// CLIENT DISCOVERY
export	async function discovery(frame, header) {
	this.logInfo(`Client Discovery -> - ID:${this.connectionIdString}`, frame, header);
	return this.sendDiscovery(frame, header);
}
// SERVER DISCOVERY
export	async function sendDiscovery() {
	const header = [
		false,
		discoveryHeaderRPC,
		this.id,
	];
	this.setState(1);
	await this.send(null, header);
}
