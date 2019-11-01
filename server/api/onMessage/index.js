module.exports = (server) => {
	const {
		cnsl,
		logImprt,
		error: logError,
		success,
		app,
		utility: {
			stringify,
			hasValue
		}
	} = server;
	logImprt('ON PUBLIC MESSAGE', __dirname);
	const onMessage = async (socket, message) => {
		const {
			body,
			sid,
			api
		} = message;
		if (!api) {
			return logError(`Invalid no method name given. ${stringify(message)}`);
		}
		const method = app[api];
		if (method) {
			if (body) {
				if (hasValue(sid)) {
					cnsl(`Request:${api} RequestID: ${sid}`, message.body);
					const response = {
						sid
					};
					const hasResponse = await method(socket, message, response);
					if (hasResponse) {
						socket.send(response);
					}
					return;
				} else {
					const eid = message.eid;
					if (hasValue(eid)) {
						success(`Request:${method} Emit ID:${eid} ${stringify(message)}`);
						method(socket, body, message);
					} else {
						return logError(`Invalid Request type. No Emit ID was given. ${stringify(message)}`);
					}
				}
			} else {
				return logError(`Invalid Request no body was sent. ${stringify(message)}`);
			}
		} else {
			return logError(`Invalid method name given. ${stringify(message)}`);
		}
	};
	server.api.onMessage = onMessage;
};
