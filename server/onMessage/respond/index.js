module.exports = async (state) => {
	const {
		send,
		logImprt,
		cnsl
	} = state;
	logImprt('Respond', __dirname);
	async function respond(api, body, {
		rid
	}) {
		cnsl(`Responded ${api}`);
		const message = {
			api,
			rid,
			body
		};
		await send(message);
	}
	state.respond = respond;
};
