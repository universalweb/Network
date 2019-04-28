module.exports = async (state) => {
	const {
		error: logError,
		streams,
		success,
		streamMethods,
		crypto: {
			toBase64,
			emptyNonce
		}
	} = state;
	function construct(stream, connection, receiveKey, transmitKey, streamId) {
		const {
			address,
			port
		} = connection;
		const streamIdString = toBase64(streamId);
		console.log(streamIdString, streams);
		if (streams.has(streamIdString)) {
			return logError('Ask for a new ID');
		} else {
			success(`Stream ID is open ${streamIdString}`);
		}
		streams.set(streamIdString, stream);
		stream.id = streamIdString;
		stream.idBuffer = streamId;
		stream.address = address;
		stream.port = port;
		stream.transmitKey = transmitKey;
		stream.receiveKey = receiveKey;
		stream.gracePeriod = setTimeout(() => {
			// stream.destroy(1);
		}, 5000);
		stream.messageQueue = [];
		stream.nonce = emptyNonce();
		success(`Stream Created: ID:${streamIdString} ${address}:${port}`);
	}
	streamMethods.construct = construct;
};
