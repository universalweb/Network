module.exports = async () => {
	const server = await require('../server/index.js')({
		maxMTU: 1000,
		encoding: 'utf8',
		max: 900,
		profile: `${__dirname}/../services/dis.cert`,
		resourceDirectory: `${__dirname}/resources`,
	});
	const {
		status,
		cnsl,
		utility: {
			stringify
		}
	} = server;
	cnsl('DIS Server Status', status);
	await server.api.add({
		async sign(stream, body, json) {
			cnsl('SIGN API');
			cnsl(`
      JSON:  ${stringify(json)}
      BODY:  ${stringify(body)}
      SID:${stream.id}`);
			cnsl(stream.publicCertificate);
			return {
				data: 'THIS IS WHERE THE SIGNED MESSAGE WILL BE'
			};
		}
	});
	return server;
};
