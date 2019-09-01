module.exports = (state) => {
	const {
		logImprt,
		cnsl,
		alert,
		utility: {
			stringify,
			keys,
			assign
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
	assign(state.api, api);
};
