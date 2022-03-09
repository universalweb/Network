module.exports = async (uwApp, extend) => {
	const denyFrame = (req, res, next) => {
		res.header('x-frame-options', 'DENY');
		return next();
	};
	extend.denyFrame = denyFrame;
};
