// TODO: CONSIDER REMOVAL
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
		await reply.setHeader('cacheMaxAge', cacheMaxAge);
	}
	if (allowOrigin) {
		await reply.setHeader('allowOrigin', allowOrigin);
	}
	if (contentSecurityPolicy) {
		await reply.setHeader('contentSecurityPolicy', contentSecurityPolicy);
	}
	if (serverName) {
		await reply.setHeader('serverName', serverName);
	}
	if (domain) {
		await reply.setHeader('domain', domain);
	}
	if (crossOriginPolicy) {
		await reply.setHeader('crossOriginPolicy', crossOriginPolicy);
	}
}
