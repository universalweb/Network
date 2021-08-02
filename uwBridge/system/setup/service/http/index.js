module.exports = (utility) => {
	const express = require('express');
	const http = require('http');
	const https = require('https');
	const tls = require('tls');
	const app = express();
	const appSecure = express();
	const secureContext = {};
	const createdServer = http.createServer(app);
	const createdServerSecure = https.createServer({
		SNICallback(domain, cb) {
			cb(null, tls.createSecureContext(secureContext[domain]));
		}
	}, appSecure);
	appSecure.disable('x-powered-by');
	app.disable('x-powered-by');
	utility.service.http = {
		app,
		appSecure,
		createdServer,
		createdServerSecure,
		secureContext,
	};
	console.log('http service');
};
