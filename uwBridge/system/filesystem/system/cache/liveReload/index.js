module.exports = (uwApp) => {
	const {
		config,
		sendAll,
	} = uwApp;
	const resourceDir = config.resourceDir;
	const regexReplace = /\//g;
	const assetUpdate = (filepath) => {
		sendAll({
			name: filepath.replace(resourceDir, ''),
			type: filepath.replace(resourceDir, '')
				.replace(regexReplace, '.'),
		});
	};
	const liveReload = async (filepath) => {
		if (filepath.includes(resourceDir)) {
			assetUpdate(filepath);
		}
	};
	return liveReload;
};
