module.exports = async (state) => {
	require('./validateJSONScheme')(state);
	const {
		logImprt,
		success,
		decode
	} = state;
	logImprt('PARSE MESSAGE MODULE', __dirname);
	function parseMessage(messageRaw) {
		const message = decode(messageRaw);
		success('PARSED MESSAGE', message);
	}
	state.parseMessage = parseMessage;
};
