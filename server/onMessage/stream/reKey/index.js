module.exports = (state) => {
	const {
		streamEvents: {
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
		streamMethods,
		success
	} = state;
	async function reKey(stream, certificate) {
		serverSession(serverPublicKey, serverPrivateKey, certificate.key);
		await reKeyEvent(stream);
		success(`Stream reKeyed -> ID: ${stream.id}`);
	}
	streamMethods.reKey = reKey;
};
