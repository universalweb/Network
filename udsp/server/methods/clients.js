import { createClient } from '../clients/index.js';
import { isIntroHeader } from '../../rpc/headerRPC.js';
import { noStreamID } from '../../utilities/hasConnectionID.js';
export async function addClientCount() {
	this.clientCount++;
	this.updateWorkerState();
}
export async function subtractClientCount() {
	this.clientCount--;
	this.updateWorkerState();
}
export async function createServerClient(config, idString, connection) {
	const clientSource = await createClient({
		server: this,
		connection,
		packet: config.packetDecoded,
	});
	if (!clientSource) {
		return console.trace(`Failed to create client for client connection id with ${idString}`);
	}
	config.destination = clientSource;
	this.clients.set(clientSource.connectionIdString, clientSource);
	if (this.isWorker) {
		await this.addClientCount();
	}
	this.logInfo('Client Created', this.clientCount);
	return clientSource;
}
export async function clientCheck(config, id, idString, rinfo) {
	if (noStreamID(id)) {
		if (isIntroHeader(config.packetDecoded.headerRPC)) {
			return this.createClient(config, idString, rinfo);
		}
	}
	const existingClient = this.clients.get(idString);
	if (existingClient) {
		config.destination = existingClient;
		return existingClient;
	}
	return false;
}
export async function removeClient(clientSource) {
	const { connectionIdString } = clientSource;
	if (this.clients.has(connectionIdString)) {
		await this.clients.delete(connectionIdString);
		await this.subtractClientCount();
	}
}
