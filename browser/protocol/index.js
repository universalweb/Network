module.exports = async (state) => {
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
	} = state;
	await require('./local')(state);
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
					data: createStream('THIS IS A TEXT')
				});
			}
			const {
				request,
			} = clientCache;
			const fileRequest = await request('file', {
				url,
				path: locationState
			});
			if (fileRequest[1].error) {
				return callback({
					statusCode: 404,
					data: createStream('')
				});
			}
			requestData = fileRequest[0].data.toString();
		} else {
			const freshConnection = await uws({
				service,
				profile
			});
			const {
				request,
			} = freshConnection;
			console.log(freshConnection);
			const defaultState = await request('state', {
				state: locationState
			});
			if (defaultState[0].error) {
				return callback({
					statusCode: 404,
					data: createStream('')
				});
			}
			requestData = `${indexFile}<script type="text/javascript">${defaultState[0].data.toString()}</script>`;
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
