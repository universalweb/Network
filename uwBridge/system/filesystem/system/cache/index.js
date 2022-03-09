module.exports = async (uwApp) => {
	const fs = require('fs');
	const cryptoRequire = require('crypto');
	const liveReload = require('./liveReload')(uwApp);
	const {
		config,
		system,
		client,
		watch,
		utility: {
			isArray,
			isString,
			ifInvoke,
			assign,
			eachArray,
			last,
		}
	} = uwApp;
	const hashObject = {};
	const defaultStreamSettings = {
		autoClose: true,
		encoding: 'utf-8',
	};
	const resourceDir = config.resourceDir;
	const generateChecksum = (str) => {
		return cryptoRequire.createHash('md5')
			.update(str, 'utf8')
			.digest('hex');
	};
	const cacheGet = (key) => {
		return {
			checksum: hashObject[`cs-${key}`],
			item: hashObject[key],
		};
	};
	const cacheSet = (key, dataArg, chunksumArg) => {
		const fileName = last(key.split('/'));
		if (fileName[0] === '.') {
			return;
		}
		let chunksum = chunksumArg;
		let dataAsString;
		const data = dataArg;
		if (isArray(data)) {
			if (!chunksum) {
				chunksum = generateChecksum(dataAsString);
			}
		} else if (isString(data)) {
			if (!chunksum) {
				chunksum = generateChecksum(data);
			}
		} else if (!chunksum) {
			chunksum = generateChecksum(data.toString());
		}
		if (hashObject[`cs-${key}`] === chunksum) {
			return cacheGet(key);
		}
		hashObject[`cs-${key}`] = chunksum;
		hashObject[key] = data;
		return {
			chunksum,
			item: data,
		};
	};
	const cache = (key, callbackOrData) => {
		let data;
		if (!key) {
			data = hashObject;
		} else if (callbackOrData) {
			data = cacheSet(key, callbackOrData);
		} else {
			data = cacheGet(key, callbackOrData);
		}
		return data;
	};
	const sendClientUpdate = (filepath) => {
		if (client.cache) {
			if (uwApp.debug) {
				console.log('SEND NEW VERSION OF FILE');
			}
			ifInvoke(client.cache.update, filepath);
		}
		liveReload(filepath);
	};
	const createStream = (filepath, cs, updateMode) => {
		const readableStream = fs.createReadStream(filepath, defaultStreamSettings);
		const cacheFile = [];
		readableStream.setEncoding('utf8');
		readableStream.on('data', (item) => {
			cacheFile.push(item);
		});
		readableStream.on('end', () => {
			// console.log('FILE READ COMPLETE LOAD INTO CACHE');
			cacheSet(filepath, cacheFile, cs);
			if (updateMode) {
				sendClientUpdate(filepath);
			}
		});
	};
	const checkIfFileExists = (filepath, updateMode) => {
		if (filepath.includes('.DS_Store')) {
			return;
		}
		if (filepath && filepath.includes(resourceDir)) {
			// console.log('Resource Found');
			fs.stat(filepath, (err, stats) => {
				if (err) {
					console.log(err);
					return;
				}
				if (uwApp.debug) {
					console.log(stats.ctimeMs, filepath, '\nFile found create stream \n\n');
				}
				createStream(filepath, stats.ctimeMs.toString(), updateMode);
			});
		}
	};
	watch(config.resourceDir, (filepath) => {
		if (uwApp.debug) {
			console.log(filepath);
		}
		checkIfFileExists(filepath, true);
	});
	assign(cache, {
		collection: hashObject,
		get: cacheGet,
		loadFile: checkIfFileExists,
		set: cacheSet,
	});
	const files = await require('./preLoadAssets')(uwApp);
	eachArray(files, (item) => {
		checkIfFileExists(item, false);
	});
	system.cache = cache;
};
