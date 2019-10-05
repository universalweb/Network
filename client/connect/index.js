module.exports = async (udspPrototype) => {
	const {
		utility: {
			stringify,
		},
		alert,
		cnsl
	} = udspPrototype;
	async function connect() {
		const stream = this;
		const result = await stream.request('open', {});
		alert(stringify(result));
		if (result[0] && result[0].status === 1) {
			cnsl('Connected');
			this.status.code = 1;
		}
		return result;
	}
	udspPrototype.connect = connect;
};
