module.exports = (server) => {
	const {
		socketEvents: {
			reKey: reKeyEvent,
		},
		crypto: {
			serverSession
		},
		profile: {
			ephemeral: {
				private: serverPrivateKey,
				key: serverPublicKey
			}
		},
		socketMethods,
		success
	} = server;
	async function reKey(socket, certificate) {
		serverSession(serverPublicKey, serverPrivateKey, certificate.key);
		await reKeyEvent(socket);
		success(`socket reKeyed -> ID: ${socket.id}`);
	}
	socketMethods.reKey = reKey;
};
