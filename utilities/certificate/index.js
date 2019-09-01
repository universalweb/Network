module.exports = (state) => {
	const {
		logImprt,
		cnsl,
		alert,
		certLog,
		decode,
		file: {
			read,
			write,
		},
		encode,
	} = state;
	logImprt('CERTIFICATE', __dirname);
	async function parse(raw) {
		const certificate = decode(raw);
		return certificate;
	}
	async function verify(parent, child) {
		const parentCertificate = parent;
		const childCertificate = child;
		cnsl(parentCertificate, childCertificate);
	}
	async function get(location) {
		certLog('Get => ', location);
		const file = await read(location);
		if (file) {
			return parse(file);
		} else {
			alert('FAILED TO LOAD CERT', location);
		}
	}
	state.certificate = {
		get,
		parse,
		verify,
		async save(certificate, directory = __dirname, certificateName = 'profile') {
			await write(`${directory}/${certificateName}.cert`, encode(certificate));
		},
	};
	require('./sign')(state);
	require('./create')(state);
};
