import { info } from '#logs';
export async function opn(reply) {
	const {
		resourceDirectory,
		cacheMaxAge,
		allowOrigin,
		contentSecurityPolicy,
		serverName,
		encoding,
		language,
		onConnectResponse
	} = this;
	const client = reply.client();
	const server = reply.server();
	const response = reply.response;
	info(`Server ID${client.idString}`, `Client ID${client.clientIdString}`, `Stream ID${response.sid}`);
	response.head = {};
	response.data = {
		sid: server.id
	};
	client.newKey = true;
	if (cacheMaxAge) {
		response.head.cacheMaxAge = cacheMaxAge;
	}
	if (allowOrigin) {
		response.head.allowOrigin = allowOrigin;
	}
	if (contentSecurityPolicy) {
		response.head.contentSecurityPolicy = contentSecurityPolicy;
	}
	if (serverName) {
		response.head.server = serverName;
	}
	if (encoding) {
		response.head.encoding = encoding;
	}
	if (language) {
		response.head.language = language;
	}
	if (onConnectResponse) {
		response.data.response = onConnectResponse;
	}
	// connection status - backwards compatibility
	response.state = 1;
	// REKEY THE CLIENT BEFORE SENDING BACK
	reply.send('struct');
}
