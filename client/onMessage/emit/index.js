module.exports = (state) => {
	const {
		send,
		logImprt,
		cnsl,
		utility: {
			uid
		},
	} = state;
	logImprt('Emit', __dirname);
	async function emit(api, body) {
		cnsl(`Emited`);
		const eid = uid();
		const message = {
			api,
			eid,
			body
		};
		return send(message);
	}
	state.emit = emit;
};
