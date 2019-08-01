module.exports = async (state) => {
	const {
		certificate: {
			get
		},
		configuration: {
			certificates
		},
		logImprt
	} = state;
	logImprt('Core Certificates', __dirname);
	state.certificates = {
		sentivate: await get((`${certificates || __dirname}/sentivate.cert`), true),
		active: {
			ephemeral: await get(`${certificates || __dirname}/ephemeralPrivate.cert`, true),
			master: await get(`${certificates || __dirname}/masterPrivate.cert`, true)
		}
	};
};
