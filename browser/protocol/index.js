module.exports = async (browserState) => {
	const {
		PassThrough
	} = require('stream');
	const {
		electron: {
			protocol
		},
		file: {
			read
		}
	} = browserState;
	await require('./local')(browserState);
	const uws = await require('../../client');
	const service = await uws.getCertificate(`${__dirname}/../../services/universal.web.cert`);
	const profile = await uws.getCertificate(`${__dirname}/../../profiles/default.cert`);
	const indexFile = await read(`${__dirname}/../resources/html/blank.html`);
	function createStream(text) {
		const stream = new PassThrough();
		stream.push(text);
		stream.push(null);
		return stream;
	}
	async function loadURL(url, locationState, requestRaw, callback) {
		const clientCache = await uws.get({
			service,
			profile
		});
		console.log('Client Cache', clientCache);
		let requestData = '';
		if (clientCache) {
			if (requestRaw.headers.Accept === '*/*') {
				console.log('ELECTRON BUG');
				return callback({
					statusCode: 200,
					headers: {
						'content-type': 'text/html'
					},
					data: createStream('')
				});
			}
			const fileRequest = await clientCache.request('file', {
				url,
				path: locationState
			});
			const errorHeaders = fileRequest.headers && fileRequest.headers.error;
			if (errorHeaders) {
				return callback({
					statusCode: 404,
					data: createStream('')
				});
			}
			const content = fileRequest.response.body.data.toString();
			console.log(content);
			requestData = content;
		} else {
			const freshConnection = await uws({
				service,
				profile
			});
			const connected = await freshConnection.connect({
				agent: 'node',
				entity: 'bot'
			});
			console.log('Connected', connected);
			console.log('INTRO =>', connected.response.body);
			console.log(freshConnection);
			const state = await freshConnection.request('state', {
				state: locationState
			});
			const errorHeaders = state.headers && state.headers.error;
			if (errorHeaders) {
				return callback({
					statusCode: 404,
					data: createStream('')
				});
			}
			const content = state.response.body.data.toString();
			console.log(content);
			requestData = `${indexFile}<script type="text/javascript">${content}</script>`;
		}
		return callback({
			statusCode: 200,
			headers: {
				'content-type': 'text/html'
			},
			data: createStream(requestData)
		});
	}
	protocol.registerStreamProtocol('uw', (request, callback) => {
		const url = request.url.substr(5).split('/');
		console.log('NEW WEB VIEW UDSP REQUEST', request, url);
		if (!url[0]) {
			return;
		}
		return loadURL(url[0], url[1], request, callback);
	}, (error) => {
		if (error) {
			return console.error('Failed to register protocol');
		}
	});
};
