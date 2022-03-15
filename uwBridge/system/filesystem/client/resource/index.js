module.exports = (app) => {
	const {
		utility: {
			eachArray,
			isString,
			hasDot,
			isArray
		},
		api,
		serverCache
	} = app;
	const isValid = require('is-valid-path');
	const sendFalse = (socket, response, index) => {
		response.body = {
			file: false,
			key: index,
		};
		socket.send(response);
	};
	const sendFile = (socket, response, filePath, key, checksum) => {
		const cacheItem = serverCache.get(filePath);
		console.log(filePath);
		if (cacheItem) {
			const cacheChecksum = cacheItem.checksum;
			if (checksum === cacheChecksum) {
				response.body = {
					cache: true,
					key,
				};
			} else {
				response.body = {
					file: cacheItem.item,
					cs: cacheItem.checksum,
					key,
				};
			}
		} else {
			response.body = {
				file: false,
				key,
			};
		}
		socket.send(response);
	};
	function processFile(socket, response, file, index, hasChecksums, cs) {
		if (!isString(file) || !file.length || !hasDot(file) || !isValid(file)) {
			return sendFalse(socket, response, index);
		}
		sendFile(socket, response, file, index, hasChecksums && cs[index]);
	}
	const getFiles = (request) => {
		const {
			body,
			response,
			socket,
		} = request;
		const {
			files,
			cs,
		} = body;
		const hasChecksums = isArray(cs);
		eachArray(files, async (file, index) => {
			processFile(socket, response, file, index, hasChecksums, cs);
		});
	};
	api.extend({
		get: getFiles,
	}, {
		prefix: 'file'
	});
};
