module.exports = (udspPrototype) => {
	const {
		logImprt,
		cnsl,
		utility: {
			uid,
			promise,
			uid: {
				free
			}
		},
	} = udspPrototype;
	logImprt('Request', __dirname);
	async function request(api, body) {
		const stream = this;
		const {
			requests
		} = stream;
		cnsl(`Requested ${api}`);
		const rid = uid();
		const message = {
			api,
			t: Date.now(),
			rid,
			body
		};
		await stream.send(message);
		return promise((accept) => {
			requests.set(rid, (bodyResponse, json, streamID) => {
				accept([bodyResponse, json, streamID]);
				free(rid);
			});
		});
	}
	udspPrototype.request = request;
};
