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
	async function request(api, body = null, head = {}) {
		const socket = this;
		const {
			requests
		} = socket;
		cnsl(`Requested ${api}`);
		const sid = uid();
		await socket.send({
			body,
			head,
			api,
			sid,
			t: Date.now(),
		});
		return promise((accept) => {
			requests.set(sid, (response, headers) => {
				accept({
					response,
					headers,
				});
				free(sid);
			});
		});
	}
	udspPrototype.request = request;
};
