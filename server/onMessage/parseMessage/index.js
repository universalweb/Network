module.exports = async (state) => {
	const {
		logImprt,
		msgPack: {
			decode
		}
	} = state;
	logImprt('PARSE MESSAGE MODULE', __dirname);
	function parseMessage(jsonString) {
		return decode(jsonString);
	}
	state.parseMessage = parseMessage;
};
