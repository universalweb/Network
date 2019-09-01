module.exports = (udspPrototype) => {
	const liquid = {
		async stream(message) {
			console.log(message);
		},
		async 'stream.create'(message) {
			console.log(message);
		}
	};
	udspPrototype.liquid = liquid;
};
