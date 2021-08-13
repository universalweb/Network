module.exports = async () => {
	const dir = __dirname;
	const fs = require('fs');
	const config = {
		credentials: {
			host: 'beta.universalweb.io'
		},
		database: {
			db: 'example',
			host: 'localhost',
			port: 28015,
		},
		http: {
			certs: {
				'beta.universalweb.io': {
					cert: fs.readFileSync(`${dir}/ssl/fullchain1.pem`),
					key: fs.readFileSync(`${dir}/ssl/privkey1.pem`),
				},
				'betaws.universalweb.io': {
					cert: fs.readFileSync(`${dir}/ssl/fullchain1.pem`),
					key: fs.readFileSync(`${dir}/ssl/privkey1.pem`),
				},
			},
			maxContentLength: 9999,
			maxLagTime: 40,
			plugins: {
				allowedCORSDomains: '*.universalweb.io',
				allowedDomains: ['beta.universalweb.io', 'betaws.universalweb.io'],
				allowedRequestTypes: 'GET',
				allowHeaderContentType: true,
				contentSecurityPolicy(compiledConfig) {
					return `style-src http://${compiledConfig.host} 'unsafe-inline' http://${compiledConfig.host} https://fonts.googleapis.com; script-src http://${compiledConfig.host} gstatic.com 'unsafe-eval' http://${compiledConfig.host}`;
				},
				denyFrame: true,
				noSniff: true,
				xssProtection: true,
			},
			port: 443,
			rateLimit: {
				delayAfter: 1,
				delayMs: 1000,
				max: 4,
				message: `Calm down broski that's too many requests`,
				statusCode: 200,
				windowMs: 60000,
			},
			routes: {
				get: [{
					route: '/',
				}, {
					route: '/@*',
				}, {
					route: '/p/*',
				}, {
					route: '/page/*',
				}, {
					route: '/user/*',
				}, {
					route: '/admin/*',
				}, {
					route: '/team/*',
				}],
			},
			vHost: ['beta.universalweb.io', 'betaws.universalweb.io'],
		},
		name: 'hermes',
		async onStart() {
			console.log(`Example Started`);
		},
		socket: {
			allowedOrigins: ['betaws.universalweb.io'],
			maxDataSize: 99999,
		},
	};
	return config;
};
