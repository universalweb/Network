module.exports = (server) => {
	const {
		send: sendClient,
		socketEvents: {
			sent: sentEvent,
		},
		socketMethods,
		success
	} = server;
	async function send(client, message, options) {
		await sendClient(client, message, options);
		await sentEvent(client, message);
		success(`socket Sent -> ID: ${client.id}`);
	}
	socketMethods.send = send;
};
