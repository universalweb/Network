module.exports = async (state) => {
	const {
		request,
		utility: {
			stringify,
		},
		alert,
		cnsl
	} = state;
	state.api = {
		async connect() {
			const result = await request('intro', {
				time: Date.now()
			});
			alert(stringify(result));
			if (result[0] && result[0].status === 1) {
				cnsl('Connected');
				state.status.code = 1;
			}
			return result;
		}
	};
};
