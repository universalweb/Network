module.exports = (state) => {
	const {
		encode,
		decode
	} = require('msgpackr');
	state.encode = encode;
	state.decode = decode;
};
