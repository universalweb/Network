const app = {
	events: {},
	start(data) {
		return app.workerRequest('configure', data);
	},
	log: console.log,
	security: {
		clear() {
			app.log('Cleanup');
			app.crate.clear();
		}
	},
	utility: window.$,
};
window.app = app;
app.crate = app.utility.crate();
export default app;
