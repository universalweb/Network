module.exports = (app) => {
	const {
		utility: {
			last,
			compact
		},
		config: {
			directory
		},
		config
	} = app;
	console.log(`Generating Config: ${config.name}`);
	config.root = directory;
	config.appFolder = last(compact(directory.split('/')));
	config.apiDir = `${directory}api/`;
	config.apiClientDir = `${config.apiDir}client/`;
	config.apiSystemDir = `${config.apiDir}system/`;
	config.siteDir = `${directory}filesystem/`;
	config.publicDir = `${config.siteDir}public/`;
	config.resourceDir = `${directory}filesystem/asset/`;
	config.http.indexLocation = `${config.siteDir}public/index.html`;
	config.http.indexErrorLocation = `${config.siteDir}public/error.html`;
};
