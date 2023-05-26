import { info } from '#logs';
import { keypair, boxSeal } from '#crypto';
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
	response.body = {
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
		response.body.response = onConnectResponse;
	}
	// connection status - backwards compatibility
	response.state = 1;
	// Server connection id
	// client.reKey = keypair();
	// response.body.reKey = boxSeal(client.reKey.publicKey, client.publicKey);
	reply.send('struct');
}
