module.exports = async (uwApp, extend) => {
	const {
		config,
	} = uwApp;
	const allowedCORSDomainsCache = config.http.plugins.allowedCORSDomains;
	const allowedCORSDomains = (req, res, next) => {
		res.header('Access-Control-Allow-Origin', allowedCORSDomainsCache);
		next();
	};
	extend.allowedCORSDomains = allowedCORSDomains;
};
