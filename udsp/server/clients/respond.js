import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
export async function respond(client, response, request, server) {
	client.lastRespond = Date.now();
	response.sid = request.sid;
	await client.send(response);
	await server.nodeEvent('respond', client);
	success(`client status check/update (state) -> ID: ${client.id}`);
}