const {
	assign
} = self.$;
const app = {
	config: {},
	utility: self.$,
	events: {
		appStatus: {
			state: 0
		},
		credit(data) {
			app.creditSave = data;
			console.log('Credits Saved in worker');
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
