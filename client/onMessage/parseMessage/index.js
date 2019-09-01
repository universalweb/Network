module.exports = async (state) => {
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
