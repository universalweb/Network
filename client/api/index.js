module.exports = async (state) => {
	const {
		request,
		utility: {
			stringify,
		},
		alert,
		cnsl
	} = state;
	state.connect = async () => {
		const result = await request('open', {});
		alert(stringify(result));
		if (result[0] && result[0].status === 1) {
			cnsl('Connected');
			state.status.code = 1;
		}
		return result;
	};
};
