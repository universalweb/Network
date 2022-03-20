module.exports = async (uwApp) => {
	const {
		config: {
			resourceDir
		},
		utility: {
			hasDot,
			eachObject
		},
		serverCache
	} = uwApp;
	const LiveDirectory = require('live-directory');
	const resourceFolder = `${resourceDir}`;
	const websocketAssets = new LiveDirectory({
		path: resourceDir,
		keep: {
			extensions: ['.css', '.html', '.js', '.json']
		},
		ignore(path) {
			if (hasDot(path) && path.includes('.eslintrc.js')) {
				return true;
			}
			return path.startsWith('.');
		}
	});
	await websocketAssets.ready();
	const assetUpdate = (file) => {
		const filePath = file.path.replace(resourceFolder, '');
		console.log(serverCache.get(filePath)?.checksum);
		const cached = serverCache.set(filePath, file.content);
		console.log(cached.checksum);
		uwApp.push({
			type: 'file',
			path: assetUpdate,
			cs: cached.checksum
		});
	};
	websocketAssets.on('file_reload', (file) => {
		console.log('UPDATE', file);
		assetUpdate(file);
	});
	console.log(websocketAssets.files);
	eachObject(websocketAssets.files, (file) => {
		const filePath = file.path.replace(resourceFolder, '');
		const cached = serverCache.set(filePath, file.content);
		console.log(filePath, cached.checksum);
	});
};
