import {
	keys,
	assign,
	cleanPath,
	isString,
} from 'Acid';
import {
	success, failed, imported, msgSent, info
} from 'utilities/logs.js';
import { toBase64 } from 'utilities/crypto.js';
import { read } from 'utilities/file.js';
import path from 'path';
export async function app() {
	const {
		configuration: {
			resourceDirectory,
			cacheMaxAge,
			allowOrigin,
			contentSecurityPolicy,
			serverName,
			encoding,
			language,
			onConnectMessage
		},
	} = this;
	imported('APP', __dirname);
	const isValid = require('is-valid-path');
	const api = {
		async open(socket, request, response) {
			info(request);
			response.head = {};
			if (cacheMaxAge) {
				response.head.cacheMaxAge = cacheMaxAge;
			}
			if (allowOrigin) {
				response.head.allowOrigin = allowOrigin;
			}
			if (contentSecurityPolicy) {
				response.head.contentSecurityPolicy = contentSecurityPolicy;
			}
			if (serverName) {
				response.head.server = serverName;
			}
			if (encoding) {
				response.head.encoding = encoding;
			}
			if (language) {
				response.head.language = language;
			}
			if (onConnectMessage) {
				response.body = onConnectMessage;
			}
			response.status = 101;
			response.scid = socket.serverIdRaw;
			return true;
		},
		async reKey(socket, body) {
			info(`${toBase64(body.certificate.key)}`);
			socket.reKey(body.certificate);
		},
		async file(socket, request, response) {
			info(request);
			const { path: requestPath } = request.body;
			response.head = {};
			if (!isString(requestPath) || !requestPath.length || !isValid(requestPath)) {
				console.log('No valid state request recieved - Returning empty data');
				response.head.status = 404;
				return true;
			}
			const cleanedPath = cleanPath(`${resourceDirectory}/${requestPath}`);
			const data = await read(cleanedPath);
			const ext = path.extname(cleanedPath);
			console.log(`EXT => ${ext}`);
			response.body = {
				ext,
				data
			};
			return true;
		},
		async state(socket, request, response) {
			info(request);
			const { state: fileName } = request.body;
			response.head = {};
			if (!isString(fileName) || !isValid(fileName)) {
				console.log('No valid state request recieved - Returning empty data');
				response.head.status = 404;
				return true;
			}
			const cleanedPath = (fileName) ? cleanPath(`${resourceDirectory}/states/${fileName}/index.js`) : cleanPath(`${resourceDirectory}/states/index.js`);
			const data = await read(cleanedPath);
			console.log(cleanedPath, data);
			response.body = {
				data
			};
			return true;
		},
	};
	assign(this.app, api);
	success(`LOADED PUBLIC API: COUNT: ${keys(api).length} ||| ${keys(api).join(' , ')}`);
}
