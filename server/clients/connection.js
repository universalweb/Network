import {
	success, failed, imported, msgSent, info, msgReceived
} from '../utilities/logs.js';
async function connection(client, connectionInfo, server) {
	const {
		address,
		port
	} = connectionInfo;
	client.address = connection.address;
	client.port = connection.port;
	await server.nodeEvent('connected', client);
	success(`client Connection -> ID: ${client.id}
      address: ${address}
      port: ${port}`);
}
