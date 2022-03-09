module.exports = async (uwApp, extend) => {
	const sameOrigin = (req, res, next) => {
		res.header('x-frame-options', 'SAMEORIGIN');
		return next();
	};
	extend.sameOrigin = sameOrigin;
};
