module.exports = async (uwApp, extend) => {
	const {
		config,
	} = uwApp;
	const allowedRequestTypesCache = config.http.plugins.allowedRequestTypes;
	const allowedRequestTypes = (req, res, next) => {
		res.header('Access-Control-Allow-Methods', allowedRequestTypesCache);
		next();
	};
	extend.allowedRequestTypes = allowedRequestTypes;
};
