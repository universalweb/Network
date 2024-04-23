import { PassThrough } from 'stream';
import { currentPath } from '@universalweb/acid';
import { protocol } from 'electron';
import { read } from '#utilities/file';
import uws from '#udsp/client/index';
export * from './local/index.js';
const service = await uws.getCertificate(`${currentPath(import.meta)}/../../services/universal.web.cert`);
const profile = await uws.getCertificate(`${currentPath(import.meta)}/../../profiles/default/profile.cert`);
const indexFile = await read(`${currentPath(import.meta)}/../resources/html/blank.html`);
function createStream(text) {
	const stream = new PassThrough();
	stream.push(text);
	stream.push(null);
	return stream;
}
export async function loadURL(url, locationState, requestRaw, callback) {
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

