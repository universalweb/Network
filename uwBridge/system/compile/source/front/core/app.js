const {
	isPlainObject,
	virtualStorage,
	crate,
	hasValue
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
		if (hasValue(keyValue)) {
			return Ractive.sharedSet(keyPath, keyValue);
		} else if (isPlainObject(keyPath)) {
			return Ractive.sharedSet(keyPath);
		}
		return Ractive.sharedGet(keyPath);
	},
	store: virtualStorage(),
	crate: crate(),
	utility: $,
	modules: {},
};
app.imported = {
	get app() {
		return app;
	},
};
window.appGlobal = app;
export default app;
