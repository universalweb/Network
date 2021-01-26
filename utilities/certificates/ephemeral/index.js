/*
  Module for quickly generating identity certificates
*/
module.exports = async (state) => {
	state.certificates.ephemeral = {
		async create(config) {
			const {
				template,
				templateLocation,
				master
			} = config;
			const {
				certificate,
				utility: {
					jsonParse,
				},
				file: {
					read
				},
				encode,
				cnsl,
				success,
			} = state;
			console.log(master);
			const ephemeralTemplate = (template || jsonParse(await read(templateLocation || `${__dirname}/template.json`)));
			const ephemeral = await certificate.createEphemeral(ephemeralTemplate, master);
			cnsl('------------MASTER KEY------------');
			success('Ephemeral Certificate', `SIZE: ${encode(master).length}bytes`);
			return ephemeral;
		},
		async createDomain(config) {
			const {
				template,
				templateLocation,
				master
			} = config;
			const {
				certificate,
				utility: {
					jsonParse,
				},
				file: {
					read
				},
				encode,
				cnsl,
				success,
			} = state;
			console.log(master);
			const ephemeralTemplate = (template || jsonParse(await read(templateLocation || `${__dirname}/template.json`)));
			const ephemeral = await certificate.createDomainEphemeral(ephemeralTemplate, master);
			cnsl('------------MASTER KEY------------');
			success('Ephemeral Certificate', `SIZE: ${encode(master).length}bytes`);
			return ephemeral;
		}
	};
};
