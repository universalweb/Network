module.exports = (state) => {
	const {
		error: logError,
		streamEvents: {
			destroy: destroyEvent,
		},
		streams,
		attention,
		streamMethods
	} = state;
	async function destroy(stream, reason) {
		if (reason === 1) {
			logError(`Stream ended from inactivity. Grace period ended.
        ID: ${stream.id}
        Address: ${stream.address}
        Port: ${stream.port}
        `);
		} else if (reason === 0) {
			attention(`Stream ended due to natural causes
        ID: ${stream.id}
        Address: ${stream.address}
        Port: ${stream.port}
        `);
		}
		await destroyEvent(stream, reason);
		streams.delete(stream.id);
		stream.address = null;
		stream.port = null;
		stream.id = null;
		stream.nonce = null;
		stream.transmitKey = null;
		stream.receiveKey = null;
		stream.state = null;
	}
	streamMethods.destroy = destroy;
};
