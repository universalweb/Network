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
	async function processMessage(response, headers) {
		const socket = this;
		const {
			requests,
		} = socket;
		const {
			status,
			sid,
		} = response;
		console.log(`STATUS CODE: ${status}`);
		if (response) {
			if (response.status === 580) {
				socket.close();
				return logError(`End event sent disconnected socket`);
			}
			if (!response.status || response.status === 200 || response.status === true) {
				if (hasValue(sid)) {
					cnsl(`RequestID: ${sid} ${stringify(response)}`);
					const method = requests.get(sid);
					if (method) {
						const responseBody = await method(response, headers);
						if (responseBody) {
							socket.send(responseBody, {
								sid
							});
						}
					} else {
						return logError(`Invalid Stream Id given. ${stringify(response)}`);
					}
				} else if (response.watcher) {
					console.log('WATCHER', response);
				}
			}
		}
	}
	udspPrototype.processMessage = processMessage;
};
