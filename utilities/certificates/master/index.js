/*
  Module for quickly generating identity certificates
*/
module.exports = async (state) => {
	state.certificates.master = {
		async create(config) {
			const {
				template,
				templateLocation
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
			const masterTemplate = (template || jsonParse(await read(templateLocation || `${__dirname}/template.json`)));
			const master = await certificate.createMaster(masterTemplate);
			cnsl('------------MASTER KEY------------');
			success('Master Certificate', `SIZE: ${encode(master).length}bytes`);
			return master;
		}
	};
};
