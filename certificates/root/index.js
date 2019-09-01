/*
  Module for generating a root certificates for the root Identity Registrar servers.
*/
module.exports = async (state) => {
	state.certificates.root = {
		async create(config) {
			const template = config.template;
			const {
				certificate,
				crypto: {
					signOpen,
				},
				encode,
				cnsl,
				success,
				error,
			} = state;
			const rootCertificate = await certificate.createProfile(template);
			const {
				ephemeral,
				master
			} = rootCertificate;
			console.log(ephemeral);
			console.log(master);
			cnsl('------------EPHEMERAL KEY------------');
			const getSignature = certificate.sign(ephemeral, master, ['private', 'signature']);
			console.log('Compare Signature', Buffer.compare(getSignature, ephemeral.signature), getSignature, ephemeral.signature);
			const signature = signOpen(ephemeral.signature, master.key);
			if (signature) {
				success('Ephemeral Signature is valid');
			} else {
				return error('Ephemeral Signature is invalid');
			}
			success('Ephemeral Certificate', `SIZE: ${encode(ephemeral).length}bytes`);
			success('Master Certificate', `SIZE: ${encode(master).length}bytes`);
			success(`TOTAL KEYPAIR SIZE: ${encode(ephemeral).length + encode(master).length}bytes`);
			return rootCertificate;
		}
	};
};
