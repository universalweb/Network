const {
	isPlainObject,
	virtualStorage,
	crate
} = $;
const app = {
	events: {},
	async start(data) {
		await Ractive.sharedSet('components', {
			dynamic: {},
			layout: {},
			main: {},
		});
		Ractive.sharedData.$ = $;
		return app.workerRequest('configure', data);
	},
	log: console.log,
	security: {
		clear() {
			app.log('Cleanup');
			app.crate.clear();
		}
	},
	get app() {
		return this;
	},
	componentStore(keyPath, keyValue) {
		if (keyValue || isPlainObject(keyPath)) {
			return Ractive.sharedSet(keyPath, keyValue);
		}
		return Ractive.sharedGet(keyPath);
	},
	store: virtualStorage(),
	crate: crate(),
	utility: $,
};
app.imported = {
	get app() {
		return app;
	},
};
window.appGlobal = app;
export default app;
