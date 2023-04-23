import { info } from '#logs';
export async function connect(socket, request, response) {
	const {
		configuration: {
			resourceDirectory,
			cacheMaxAge,
			allowOrigin,
			contentSecurityPolicy,
			serverName,
			encoding,
			language,
			onConnectMessage
		},
	} = this;
	info(socket.id, request);
	response.head = {};
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
	if (onConnectMessage) {
		response.body = onConnectMessage;
	}
	// connection status - backwards compatibility
	response.status = 101;
	// Server connection id
	response.scid = socket.serverIdRaw;
	return true;
}
