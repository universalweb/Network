/*
  Module for generating a client certificates
*/
(async () => {
	const state = {
		utility: require('Lucy'),
		type: 'Client Certificate'
	};
	await require('../../console/')(state);
	await require('../file/')(state);
	await require('../../crypto/')(state);
	await require('../../certificate/')(state);
	const {
		certificate,
		crypto: {
			signOpen,
			toBuffer,
		},
		utility: {
			stringify
		},
		cnsl,
		success,
		error,
	} = state;
	const additionalEphemeral = {
		version: 1,
		id: '3',
		parent: '2',
		algo: 'default',
		end: Date.now() + 9999999999,
	};
	const additionalMaster = {
		version: 1,
		id: '2',
		parent: '1',
		algo: 'default',
		country: 'US',
		contact: 'default@sentivate.company',
		end: Date.now() + 99999999990,
	};
	const certificates = await certificate.create(__dirname, additionalEphemeral, additionalMaster);
	const {
		ephemeral,
		master
	} = certificates.certificates;
	cnsl('------------EPHEMERAL KEY------------');
	const bufferedSignature = toBuffer(ephemeral.signature);
	const signature = signOpen(bufferedSignature, certificates.keypairs.master.publicKey);
	if (signature) {
		success('Ephemeral Signature is valid');
	} else {
		return error('Ephemeral Signature is invalid');
	}
	success('Ephemeral Certificate', ephemeral.data, `SIZE: ${stringify(ephemeral.data).length}bytes`);
	success('Master Certificate', master.data, `SIZE: ${stringify(master.data).length}bytes`);
	success(`TOTAL KEYPAIR SIZE: ${stringify(ephemeral.data).length + stringify(master.data).length}bytes`);
})();
