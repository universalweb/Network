(async () => {
	const state = {};
	await require('../utilities/console/')(state);
	await require('../utilities/file/')(state);
	const {
		certificate: {
			get
		}
	} = state;
	const sign = require('../sign/');
	const signer = get('../root/emphemeral.cert');
	const certificate = get('../client/profiles/default/emphemeral.cert');
	console.log(sign(certificate, signer));
})();
