module.exports = (server) => {
	const {
		send,
		logImprt,
		cnsl,
		utility: {
			uid
		},
	} = server;
	logImprt('Emit', __dirname);
	async function emit(api, body) {
		cnsl(`Emitted ${api}`);
		const eid = uid();
		const message = {
			api,
			eid,
			body
		};
		await send(message);
	}
	server.emit = emit;
};
