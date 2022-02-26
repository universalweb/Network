const { assign } = self.$;
const app = {
	config: {},
	utility: self.$,
	events: {
		appStatus: {
			state: 0
		},
		post(id, data, options) {
			const responseData = {
				data,
				id
			};
			assign(responseData, options);
			postMessage(responseData);
		},
		socket: {}
	}
};
export default app;
