import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function connection(client, connectionInfo, server) {
	const {
		address,
		port
	} = connectionInfo;
	client.address = connection.address;
	client.port = connection.port;
	await server.clientEvent('connected', client);
	success(`client Connection -> ID: ${client.id}
      address: ${address}
      port: ${port}`);
}
