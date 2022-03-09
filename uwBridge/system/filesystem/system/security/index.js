module.exports = async (uwApp) => {
	const cryptoLib = require('crypto');
	const {
		system,
	} = uwApp;
	const checksum = (str, algorithm, encoding) => {
		return cryptoLib.createHash(algorithm || 'md5')
			.update(str, 'utf8')
			.digest(encoding || 'hex');
	};
	system.security = {
		checksum,
	};
};
