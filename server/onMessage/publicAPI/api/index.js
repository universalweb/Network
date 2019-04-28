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
		async intro(stream, body, json) {
			cnsl(`
      JSON:  ${stringify(json)}
      BODY:  ${stringify(body)}
      SID:${stream.id}`);
			return {
				status: 1
			};
		},
		async reKey(stream, body) {
			cnsl(`${toBase64(body.certificate.key)}`);
			stream.reKey(body.certificate);
		},
		/*
      * (Max buffer size / (Speed * Round Trip Time))
      * Proof of work to slow down API access and drive up CPU cost on potential attackers.
      * POW will also act as flow-control to the API.
      * One of many instances used to control the flow of API access and drive up the costs for attackers
    */
		async stream(stream, body, connection, json, streamID) {
			cnsl(`
      Connection:${stringify(connection)}
      JSON:  ${stringify(json)}
      SID:${streamID}`);
			return {
				band: 1,
				work: 0
			};
		}
	};
	alert(`LOADED PUBLIC API: COUNT: ${keys(api).length} ||| ${keys(api).join(' , ')}`);
	state.public.api = api;
};
