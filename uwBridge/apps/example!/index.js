module.exports = async function() {
	const dir = __dirname;
	console.log('APP CONFIG START', dir);
	const config = {
		credentials: {
			host: 'localhost'
		},
		database: {
			table: 'mongoDBTable',
			host: '127.0.0.1',
			port: '27017',
			maxTimeMS: 2000,
			maxScan: 100,
			// Paging
			defaultLimit: 8,
			maxLimit: 30,
		},
		http: {
			maxContentLength: 9999,
			maxLagTime: 40,
			plugins: {
				allowedCORSDomains: 'localhost',
				allowedDomains: ['localhost', 'lnkit.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com'],
				allowedRequestTypes: 'GET',
				allowHeaderContentType: true,
				// contentSecurityPolicy(compiledConfig) {
				// 	return `style-src http://${compiledConfig.host} cdn.jsdelivr.net; 'unsafe-inline' http://${compiledConfig.host} https://fonts.googleapis.com cdn.jsdelivr.net; script-src http://${compiledConfig.host} gstatic.com cdn.jsdelivr.net'unsafe-eval' http://${compiledConfig.host}`;
				// },
				denyFrame: true,
				noSniff: true,
				xssProtection: true,
			},
			port: 80,
			rateLimit: {
				delayAfter: 1,
				delayMs: 1000,
				max: 4,
				message: `Too many requests`,
				statusCode: 200,
				windowMs: 60000,
			},
			routes: {
				get: [{
					route: '/',
				}, {
					route: '/page/*',
				}, {
					route: '/settings/',
				}, {
					route: '/login/',
				}, {
					route: '/signup/',
				}, {
					route: '/user/*',
				}],
			},
			vHost: ['localhost'],
		},
		name: 'example',
		async onStart() {
			console.log(`example Started`);
		},
		socket: {
			allowedOrigins: ['localhost', 'cdn.jsdelivr.net', 'fonts.googleapis.com'],
			maxDataSize: 99999,
		},
	};
	console.log('APP CONFIG END');
	return config;
};
