module.exports = async (state) => {
	const {
		streamEvents: {
			connected: connectedEvent,
		},
		streamMethods,
		success
	} = state;
	async function connected(stream) {
		stream.state = Date.now();
		clearTimeout(stream.gracePeriod);
		await connectedEvent(stream);
		success(`Stream Connected -> ID: ${stream.id}`);
	}
	streamMethods.connected = connected;
};
