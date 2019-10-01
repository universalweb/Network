(async () => {
	const state = require('../state/')('SIgnature Testing', {
		bufferSize: 2 ** 20
	});
	const {
		certificate: {
			get
		}
	} = state;
	const idcert = await get('../profiles/default.cert');
	console.log(idcert);
	// console.log(sign(certificate, signer));
})();
