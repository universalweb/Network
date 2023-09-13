import { info } from '#logs';
export async function attachDefaultHeaders(reply) {
	const {
		defaultHeaders: {
			cacheMaxAge,
			allowOrigin,
			contentSecurityPolicy,
			serverName,
			domain,
			crossOriginPolicy
		},
	} = this;
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
	if (domain) {
		reply.setHeader('domain', domain);
	}
	if (crossOriginPolicy) {
		reply.setHeader('crossOriginPolicy', crossOriginPolicy);
	}
}
