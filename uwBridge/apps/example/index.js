module.exports = function appConfig() {
	const config = {
		name: 'example',
		onStart() {
			console.log(`Example App Started`);
		},
		database: {
			db: 'tommarchi',
			host: 'localhost',
			port: 28015,
		},
		credentials: {
			host: 'tommarchi.com',
		},
		http: {
			port: 80,
			vHost: ['tommarchi.com', 'ws.tommarchi.com'],
			maxContentLength: 9999,
			maxLagTime: 40,
			rateLimit: {
				windowMs: 60000, // default 1M 60000ms
				delayAfter: 1, // default 1
				delayMs: 1000, // default 1000
				statusCode: 200, // default 429
				max: 4, // default 5
				message: `Calm down broski that's too many requests`,
			},
			plugins: {
				noSniff: true,
				denyFrame: true,
				xssProtection: true,
				contentSecurityPolicy(compiledConfig) {
					return `style-src http://${compiledConfig.host} 'unsafe-inline' http://${compiledConfig.host} https://fonts.googleapis.com; script-src http://${compiledConfig.host} gstatic.com 'unsafe-eval' http://${compiledConfig.host}`;
				},
				allowedDomains: ['tommarchi.com', 'ws.tommarchi.com'],
				allowedCORSDomains: '*.tommarchi.com',
				allowedRequestTypes: 'GET',
				allowHeaderContentType: true,
			},
			routes: {
				get: [{
					route: '/',
				}, {
					route: '/page/*',
				}],
			},
		},
		socket: {
			maxDataSize: 99999,
			allowedOrigins: 'ws.tommarchi.com',
		},
	};
	return config;
};
