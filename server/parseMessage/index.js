module.exports = async (server) => {
	const {
		logImprt,
		decode,
	} = server;
	logImprt('PARSE MESSAGE MODULE', __dirname);
	function parseMessage(msgPack) {
		const request = decode(msgPack);
		if (request.head) {
			request.head = decode(request.head);
		}
		if (request.body) {
			request.body = decode(request.body);
		}
		return request;
	}
	server.parseMessage = parseMessage;
};
