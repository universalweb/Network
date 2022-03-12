module.exports = (uwApp) => {
	const {
		send,
		config: {
			resourceDir
		}
	} = uwApp;
	const regexReplace = /\//g;
	const assetUpdate = (filepath) => {
		send({
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
