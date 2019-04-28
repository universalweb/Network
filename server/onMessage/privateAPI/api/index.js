module.exports = async (state) => {
	const {
		logImprt,
		cnsl,
		alert,
		utility: {
			stringify,
			keys
		},
		crypto: {
			toBase64
		}
	} = state;
	logImprt('PUBLIC API', __dirname);
	const api = {
		async file(stream, body, json) {
			cnsl(`
      JSON:  ${stringify(json)}
      BODY:  ${stringify(body)}
      SID:${stream.id}`);
			return {
				data: 'THIS IS THE FIRST UW SITE'
			};
		},
		async reKey(stream, body) {
			cnsl(`${toBase64(body.certificate.key)}`);
			stream.reKey(body.certificate);
		},
	};
	alert(`LOADED PUBLIC API: COUNT: ${keys(api).length} ||| ${keys(api).join(' , ')}`);
	state.private.api = api;
};
