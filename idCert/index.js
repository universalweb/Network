/*
  Module for quickly generating reserved domain certificates you must contact the team for official registration/signing.
	This is not required but will speed up the reservation process.
	Make sure to fill in the ephemeral/master json files with you data before running this script.
	The resulting certificates will be generated in this same folder.
*/
(async () => {
	const state = {
		type: 'Domain Certificate Creation',
		utility: require('Lucy')
	};
	await require('../utilities/console/')(state);
	await require('../utilities/file/')(state);
	await require('../utilities/crypto/')(state);
	await require('../utilities/certificate/')(state);
	await require('../sign/')(state);
	const {
		certificate,
		crypto: {
			signOpen,
			toBuffer,
		},
		utility: {
			stringify,
			jsonParse,
		},
		file: {
			read
		},
		cnsl,
		success,
		error,
	} = state;
	const additionalEphemeral = jsonParse(await read(`${__dirname}/ephemeral.json`));
	const additionalMaster = jsonParse(await read(`${__dirname}/master.json`));
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
