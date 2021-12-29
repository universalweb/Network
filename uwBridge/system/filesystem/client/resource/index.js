module.exports = (app) => {
	const {
		utility: {
			eachArray,
			isString,
			hasDot,
		},
		api,
		config: {
			resourceDir,
		},
		system: {
			cache,
		},
	} = app;
	const isValid = require('is-valid-path');
	const fs = require('fs');
	const path = require('path');
	const truncate = require('truncate-utf8-bytes');
	const cacheSet = cache.set;
	const cacheGet = cache.get;
	const pathNormalize = path.normalize;
	const defaultStreamSettings = {
		autoClose: true,
		encoding: 'utf-8',
	};
	const sendChunks = (socket, response, cached, index) => {
		eachArray(cached, async (item) => {
			response.data = {
				file: item,
				key: index,
			};
			socket.send(response);
		});
	};
	const streamOnEnd = (socket, response, index, checksum, cached) => {
		if (cached) {
			sendChunks(socket, response, cached, index);
		}
		response.data = {
			cs: checksum,
			key: index,
		};
		socket.send(response);
	};
	const onEndCallback = (socket, response, index, filePath, cacheFile, checksumArg) => {
		let cached;
		let checksum;
		if (cacheFile) {
			if (cacheFile.item) {
				// console.log('Loading fresh file', filePath);
				cached = cacheFile;
			} else {
				cached = cacheSet(filePath, cacheFile, checksumArg);
			}
			checksum = cached.checksum;
			cached = cached.item;
		} else {
			checksum = cacheGet(filePath)
				.checksum;
		}
		streamOnEnd(socket, response, index, checksum, cached);
	};
	const createStream = (socket, response, filePath, index, checksum) => {
		const readableStream = fs.createReadStream(filePath, defaultStreamSettings);
		const cacheFile = [];
		readableStream.setEncoding('utf8');
		readableStream.on('data', (chunk) => {
			cacheFile.push(chunk);
		});
		readableStream.on('end', () => {
			onEndCallback(socket, response, index, filePath, cacheFile, checksum);
		});
	};
	const sendFalse = (socket, response, index) => {
		response.data = {
			file: false,
			key: index,
		};
		socket.send(response);
	};
	const fsStat = (socket, response, filePath, index, err, stats) => {
		if (err) {
			sendFalse(socket, response, index);
		} else {
			createStream(socket, response, filePath, index, stats.ctime.toString());
		}
	};
	const sendValidChecksum = async (socket, response, index) => {
		response.data = {
			cache: true,
			key: index,
		};
		socket.send(response);
	};
	const illegalRe = /[?<>\\:*|":]/g;
	const controlRe = /[\x00-\x1f\x80-\x9f]/g;
	const reservedRe = /^\.+$/;
	const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
	const normalizeFilePatch = (filepath) => {
		return truncate(pathNormalize(resourceDir + filepath)
			.replace(illegalRe, '')
			.replace(controlRe, '')
			.replace(reservedRe, '')
			.replace(windowsReservedRe, ''), 255);
	};
	const checkIfFileExists = (socket, response, item, index, checksums) => {
		const filePath = normalizeFilePatch(item);
		const cacheItem = cacheGet(filePath);
		const cacheChecksum = cacheItem.checksum;
		if (cacheChecksum) {
			const checksum = checksums[index];
			// console.log(checksum, cacheChecksum, checksum === cacheChecksum, filePath);
			if (checksum === cacheChecksum) {
				sendValidChecksum(socket, response, index);
			} else {
				onEndCallback(socket, response, index, filePath, cacheItem);
			}
		} else {
			// console.log('Loading fresh file', filePath);
			fs.stat(filePath, (err, stats) => {
				fsStat(socket, response, filePath, index, err, stats);
			});
		}
	};
	const authRegex = /auth\//;
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
		const loginStatus = socket.credit;
		eachArray(files, async (file, index) => {
			if (authRegex.test(file)) {
				if (!loginStatus || !socket.account || !socket.account.auth || !socket.account.auth.file.test(file)) {
					console.log(`Auth Access ${file} ${socket.id}`);
					return sendFalse(socket, response, index);
				}
			}
			if (!isString(file) || !file.length || !hasDot(file) || !isValid(file)) {
				return sendFalse(socket, response, index);
			}
			checkIfFileExists(socket, response, file, index, cs);
		});
	};
	api.extend({
		get: getFiles,
	}, {
		prefix: 'file'
	});
};
