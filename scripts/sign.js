(async () => {
	const state = require('../state/')('SIgnature Testing');
	const {
		certificate: {
			get
		}
	} = state;
	const idcert = await get('../profiles/default.cert');
	console.log(idcert);
	// console.log(sign(certificate, signer));
})();
