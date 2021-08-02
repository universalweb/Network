async function main() {
	const system = await require('./system')({
		http: {
			connectionTimeout: 60000
		}
	});
	return system;
}
module.exports = main();
