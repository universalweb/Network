module.exports = async (state) => {
	const fs = require('fs');
	const path = require('path');
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
	const indexFile = await read('./resources/blank.html');
	function createStream(text) {
		const stream = new PassThrough();
		stream.push(text);
		stream.push(null);
		return stream;
	}
	protocol.registerFileProtocol('local', (request, callback) => {
		const url = request.url.substr(8);
		console.log(`${__dirname}/../${url}`);
		callback({
			path: path.normalize(`${__dirname}/../${url}`)
		});
	}, (error) => {
		if (error) {
			console.error('Failed to register protocol');
		}
	});
	async function loadURL(url, locationState, callback) {
		const client = await require('../client')(url, 8880);
		const {
			request,
			connect,
			profile: {
				activate: activateProfile
			}
		} = client;
		console.log('CONNECTING TO UDSP SERVER');
		await activateProfile('default');
		await connect();
		const defaultState = await request('state', {
			state: '/'
		});
		callback({
			statusCode: 200,
			headers: {
				'content-type': 'text/html'
			},
			data: createStream(`${indexFile}<script type="text/javascript">${defaultState[0].data}</script>`)
		});
	}
	protocol.registerStreamProtocol('uw', (request, callback) => {
		const url = request.url.substr(5).split('/');
		console.log('NEW WEB VIEW UDSP REQUEST', request, url);
		if (request.url[0] === '.') {
			return callback(fs.createReadStream(request.url.substr(5)));
		}
		loadURL(url[0], url[1], callback);
	}, (error) => {
		if (error) {
			console.error('Failed to register protocol');
		}
	});
};
