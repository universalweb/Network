module.exports = (state) => {
	const {
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
		return this.send(message);
	}
	state.emit = emit;
};
