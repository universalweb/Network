module.exports = (type, options, stateObject = {}) => {
	const msgPack = require('what-the-pack').initialize(options.bufferSize);
	const utility = require('Lucy');
	const {
		assign
	} = utility;
	const state = assign(stateObject, {
		type,
		utility,
		msgPack
	});
	state.encode = msgPack.encode;
	state.decode = msgPack.decode;
	require('../utilities/console/')(state);
	require('../utilities/file/')(state);
	require('../utilities/crypto/')(state);
	require('../utilities/certificate/')(state);
	return state;
};
