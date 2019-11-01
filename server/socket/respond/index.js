module.exports = async (server) => {
	const {
		logImprt,
		cnsl,
		socketMethods
	} = server;
	logImprt('Respond', __dirname);
	async function respond(response, request) {
		response.sid = request.sid;
		cnsl(`Responded`, response, request);
		await this.send(response);
	}
	socketMethods.respond = respond;
};
