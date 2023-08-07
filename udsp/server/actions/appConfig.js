import { info } from '#logs';
export async function intro(reply) {
	const {
		resourceDirectory,
		cacheMaxAge,
		allowOrigin,
		contentSecurityPolicy,
		serverName,
		textEncoding,
		language,
		onConnectResponse,
		response
	} = this;
	const client = reply.client();
	const server = reply.server();
	const request = reply.data;
	info(`Server ID${client.idString}`, `Client ID${client.clientIdString}`, `Stream ID${response.sid}`);
	response.data = {
		scid: client.id
	};
	if (cacheMaxAge) {
		reply.setHeader('cacheMaxAge', cacheMaxAge);
	}
	if (allowOrigin) {
		reply.setHeader('allowOrigin', allowOrigin);
	}
	if (contentSecurityPolicy) {
		reply.setHeader('contentSecurityPolicy', contentSecurityPolicy);
	}
	if (serverName) {
		reply.setHeader('serverName', serverName);
	}
	if (textEncoding) {
		reply.setHeader('encoding', textEncoding);
	}
	if (language) {
		reply.setHeader('language', language);
	}
	if (onConnectResponse) {
		response.data.message = onConnectResponse;
	}
	reply.setHeader('serialize', true);
	// swap to new key but only for the specific request?
	const clientResponse = await reply.send();
	console.log(clientResponse);
}
