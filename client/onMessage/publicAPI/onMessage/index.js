module.exports = async (state) => {
	const {
		cnsl,
		logImprt,
		send,
		error: logError,
		success,
		requests,
		public: {
			api
		},
		utility: {
			stringify,
			hasValue
		},
		streamID
	} = state;
	logImprt('ON PUBLIC MESSAGE', __dirname);
	const onMessage = async (json, puzzleFlag, packet, connection) => {
		const body = json.body;
		if (body) {
			const rid = json.rid;
			if (hasValue(rid)) {
				cnsl(`RequestID: ${rid} ${stringify(json)}`);
				const method = requests.get(rid);
				if (method) {
					const responseBody = await method(body, json, streamID);
					if (responseBody) {
						send({
							rid,
							body: responseBody
						}, connection);
					}
				} else {
					return logError(`Invalid request ID given. ${stringify(json)}`);
				}
			} else {
				const methodName = json.api;
				if (!methodName) {
					return logError(`Invalid no method name given. ${stringify(json)}`);
				}
				const method = api[methodName];
				if (method) {
					const eid = json.eid;
					if (hasValue(eid)) {
						success(`Request:${method} Emit ID:${eid} ${stringify(json)}`);
						method(body, json, streamID);
					} else {
						return logError(`Invalid Request type. No Emit ID or Request ID was given. ${stringify(json)}`);
					}
				} else {
					return logError(`Invalid method name given. ${stringify(json)}`);
				}
			}
		} else {
			return logError(`Invalid message no body was sent. ${stringify(json)}`);
		}
	};
	state.public.onMessage = onMessage;
};
