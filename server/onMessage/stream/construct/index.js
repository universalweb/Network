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
	function construct(stream, connection, receiveKey, transmitKey, streamId, publicCertificate, sentTime) {
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
		success(`MESSAGE SENT TIME: ${sentTime}`);
		streams.set(streamIdString, stream);
		stream.id = streamIdString;
		stream.idBuffer = streamId;
		stream.address = address;
		stream.port = port;
		stream.transmitKey = transmitKey;
		stream.receiveKey = receiveKey;
		stream.pending = false;
		stream.gracePeriod = setTimeout(() => {
			if (stream.pending === false) {
				stream.destroy(1);
			}
		}, 10000);
		stream.messageQueue = [];
		stream.nonce = emptyNonce();
		stream.publicCertificate = publicCertificate;
		success(`Stream Created: ID:${streamIdString} ${address}:${port}`);
	}
	streamMethods.construct = construct;
};
