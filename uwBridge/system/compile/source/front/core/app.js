const app = {
	events: {},
	start(data) {
		return app.workerRequest('configure', data);
	},
	log(...args) {
		if (app.debug) {
			apply(console.log, console, args);
		}
	},
	security: {
		clear() {
			app.log('Cleanup');
			app.crate.clear();
		}
	},
	utility: window.$,
};
window.app = app;
const vStorage = {
	hasLocal: false,
	items: {},
	getItem(key) {
		return vStorage.items[key];
	},
	setItem(key, value) {
		vStorage.items[key] = value;
		return;
	},
	clear() {
		vStorage.storage.items = {};
		return;
	},
	removeItem(key) {
		vStorage.items[key] = null;
		return;
	},
};
function hasStorage(storeCheck) {
	try {
		storeCheck().removeItem('TESTING');
		vStorage.hasLocal = true;
	} catch (e) {
		console.log(e);
		vStorage.hasLocal = false;
	}
}
hasStorage(() => {
	return localStorage;
});
class Crate {
	constructor() {
		this.storage = (vStorage.hasLocal) ? localStorage : vStorage;
	}
	setItem(key, value) {
		return this.storage.setItem(key, value);
	}
	getItem(key) {
		return this.storage.getItem(key);
	}
	clear() {
		return this.storage.clear();
	}
	removeItem(key) {
		return this.storage.removeItem(key);
	}
}
app.crate = new Crate();
export default app;
