module.exports = (type, options = {}, stateObject = {}) => {
	const utility = require('Lucy');
	const {
		assign
	} = utility;
	const state = assign(stateObject, {
		type,
		utility,
	});
	require('../utilities/console/')(state);
	if (options) {
		const {
			bufferSize
		} = options;
		if (bufferSize) {
			const {
				encode,
				decode
			} = require('what-the-pack').initialize(bufferSize);
			state.encode = encode;
			state.decode = decode;
		}
	}
	require('../utilities/file/')(state);
	require('../utilities/crypto/')(state);
	require('../utilities/certificate/')(state);
	return state;
};
