const app = {
	events: {},
	start(data) {
		return app.workerRequest('configure', data);
	},
	utility: window.$,
};
window.app = app;
export default app;
