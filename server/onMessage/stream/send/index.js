module.exports = async (state) => {
	const {
		send: sendClient,
		streamEvents: {
			sent: sentEvent,
		},
		streamMethods,
		success
	} = state;
	async function send(stream, message) {
		await sendClient(message, stream.address, stream.port, stream.nonce, stream.transmitKey, stream.id, stream.idBuffer);
		await sentEvent(stream, message);
		success(`Stream Sent -> ID: ${stream.id}`);
	}
	streamMethods.send = send;
};
