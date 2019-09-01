/*
  Module for quickly generating domain certificates you must contact the team for official registration/signing.
*/
module.exports = async (state) => {
	state.certificates.domain = {
		async create(config) {
			const {
				template,
				templateLocation
			} = config;
			const {
				certificate,
				crypto: {
					signOpen,
				},
				utility: {
					jsonParse,
				},
				file: {
					read
				},
				encode,
				cnsl,
				success,
				error,
			} = state;
			const profileTemplate = (template || jsonParse(await read(templateLocation || `${__dirname}/template.json`)));
			const domainCertificate = await certificate.createProfile(profileTemplate);
			const {
				ephemeral,
				master
			} = domainCertificate;
			cnsl('------------EPHEMERAL KEY------------');
			const getSignature = certificate.sign(ephemeral, master, ['private', 'signature']);
			const checkSignature = Buffer.compare(getSignature, ephemeral.signature);
			console.log('Compare Signature', checkSignature);
			const signature = signOpen(ephemeral.signature, master.key);
			if (signature && checkSignature === 0) {
				success('Ephemeral Signature is valid');
			} else {
				return error('Ephemeral Signature is invalid');
			}
			success('Ephemeral Certificate', `SIZE: ${encode(ephemeral).length}bytes`);
			success('Master Certificate', `SIZE: ${encode(master).length}bytes`);
			success(`TOTAL KEYPAIR SIZE: ${encode(ephemeral).length + encode(master).length}bytes`);
			return domainCertificate;
		}
	};
};
