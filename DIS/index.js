module.exports = async () => {
	const server = await require('../server/index.js')({
		ip: 'localhost',
		port: 8880,
		maxMTU: 1000,
		encoding: 'utf8',
		max: 900,
		certificates: `${__dirname}/certificates`,
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
