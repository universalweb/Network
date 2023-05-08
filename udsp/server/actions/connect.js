import { info } from '#logs';
export async function opn(message, reply) {
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
	const response = reply.response;
	info(`Client ID${client.id}`, `Stream ID${response.sid}`);
	response.head = {};
	response.body = {};
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
		response.body.response = onConnectResponse;
	}
	// connection status - backwards compatibility
	response.state = 1;
	// Server connection id
	response.scid = client.serverIdRaw;
	reply.send('struct');
}
