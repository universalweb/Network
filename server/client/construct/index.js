module.exports = (server) => {
	const {
		error: logError,
		clients,
		success,
		socketMethods,
		crypto: {
			toBase64,
			emptyNonce,
			randombytes_buf
		},
		configuration: {
			id: serverId
		}
	} = server;
	function construct(socket, connection, receiveKey, transmitKey, clientId, publicCertificate, sentTime) {
		const {
			address,
			port
		} = connection;
		const clientIdString = toBase64(clientId);
		const serverConnectionUUID = Buffer.alloc(8);
		randombytes_buf(serverConnectionUUID);
		/*
			Concatenating the serverConnectionUUID and the Server ID is used for loadbalancing or
			for forwarding requests to the correct server.
		*/
		const serverIdBuffer = Buffer.concat([serverConnectionUUID, Buffer.from(serverId)]);
		const serverIdString = toBase64(serverIdBuffer);
		console.log(`Client Connection ID: ${clientIdString}`);
		console.log(`Server Connection ID: ${serverIdString}`);
		if (clients.has(serverIdString)) {
			logError('ID IN USE NEED TO MAKE SOME RANDOM BITS - PATCH THIS');
		} else {
			success(`Server socket ID is open ${serverIdString}`);
		}
		success(`MESSAGE SENT TIME: ${sentTime}`);
		clients.set(serverIdString, socket);
		/*
			Sending to client using this
			Client connection Ids are smaller than server connection Ids
		*/
		socket.clientId = clientIdString;
		/*
			When the client sends to server it must use this
			This also validates origin as any following requests must use this Server Connection ID
			Server IDs are larger and are used for load balancing for efficient routing
		 	Server IDs can be random with some actionable info
			The client ID can be used as the base of the server ID and then generate the rest to form a unique server specific ID
		*/
		socket.serverId = serverIdString;
		socket.id = serverIdString;
		socket.clientIdRaw = clientId;
		socket.serverIdRaw = serverIdBuffer;
		socket.address = address;
		socket.port = port;
		socket.transmitKey = transmitKey;
		socket.receiveKey = receiveKey;
		socket.pending = false;
		socket.gracePeriod = setTimeout(() => {
			if (socket.pending === false) {
				socket.destroy(1);
			}
		}, 10000);
		socket.nonce = emptyNonce();
		socket.publicCertificate = publicCertificate;
		/*
			Packets that need to be sent and confirmed
		*/
		socket.sendBuffer = new Map();
		success(`socket Created: ID:${serverIdString} ${address}:${port}`);
		console.log(socket);
	}
	socketMethods.construct = construct;
};
