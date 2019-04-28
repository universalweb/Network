module.exports = async (state) => {
	const {
		logImprt,
		cnsl,
		alert,
		utility: {
			stringify,
			keys
		}
	} = state;
	logImprt('PUBLIC API', __dirname);
	const api = {
		async intro(body, connection, json, streamID) {
			cnsl(`
      Connection:${stringify(connection)}
      JSON:  ${stringify(json)}
      SID:${streamID}`);
		},
		async stream(body, connection, json, streamID) {
			cnsl(body, connection, json, streamID);
		}
	};
	alert(`LOADED PUBLIC API: COUNT: ${keys(api).length} ||| ${keys(api).join(' , ')}`);
	state.public.api = api;
};
