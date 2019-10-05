module.exports = (udspPrototype) => {
	const {
		cnsl,
		logImprt,
		error: logError,
		utility: {
			stringify,
			hasValue
		},
	} = udspPrototype;
	logImprt('ON PUBLIC MESSAGE', __dirname);
	async function processMessage(json, puzzleFlag, packet, connection) {
		const stream = this;
		const {
			requests,
		} = stream;
		const streamID = stream.streamId;
		const body = json.body;
		const requestError = json.error;
		if (body || requestError) {
			const rid = json.rid;
			if (hasValue(rid)) {
				cnsl(`RequestID: ${rid} ${stringify(json)}`);
				const method = requests.get(rid);
				if (method) {
					const responseBody = await method(body, json, streamID);
					if (responseBody) {
						stream.send({
							rid,
							body: responseBody
						}, connection);
					}
				} else {
					return logError(`Invalid request ID given. ${stringify(json)}`);
				}
			} else if (json.watcher) {
				console.log('WATCHER', json);
			}
		} else if (json.end) {
			stream.close();
			return logError(`End event sent disconnected stream`);
		}
	}
	udspPrototype.processMessage = processMessage;
};
