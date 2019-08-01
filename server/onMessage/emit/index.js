module.exports = async (state) => {
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
		cnsl(`Emitted ${api}`);
		const eid = uid();
		const message = {
			api,
			eid,
			body
		};
		await send(message);
	}
	state.emit = emit;
};
