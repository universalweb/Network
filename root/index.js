/*
  Module for generating a root certificates for the root Identity Registrar servers.
*/
(async () => {
	const state = {
		type: 'Certificate Creation',
		utility: require('Lucy')
	};
	await require('../utilities/console/')(state);
	await require('../utilities/file/')(state);
	await require('../utilities/crypto/')(state);
	await require('../utilities/certificate/')(state);
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
		id: '1',
		parent: '0',
		version: 1,
		host: 'identity.registrar',
		ip: '192.168.1.1',
		port: 80,
		pad: 900,
		issuer: 'Sentivate',
		issuerID: '0',
		algo: 'default',
		end: Date.now() + 99999999990,
		master: '0'
	};
	const additionalMaster = {
		version: 1,
		algo: 'default',
		id: '0',
		type: 'root',
		issuer: 'Sentivate',
		issuerID: '0',
		country: 'US',
		contact: 'issuer',
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
