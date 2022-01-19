import app from '../app';
import multiEvent from './multiEvent';
import { cssRender, cssUnrender } from './css';
const {
	watch,
	utility: {
		each,
		get,
		apply,
	}
} = app;
const createWatchers = (currentView, item, key) => {
	if (get('isWatcher', item._)) {
		currentView.watchers[key] = item;
		return;
	}
	item.options = item.options || {};
	item.methods = item.methods || {};
	let {
		prefix,
		suffix,
	} = item.options;
	const {
		methods,
	} = item;
	const createMethod = methods.create || 'push';
	const readMethod = methods.read || 'push';
	prefix = (prefix) ? `${prefix}.` : '';
	suffix = (suffix) ? `.${suffix}` : '';
	item.prefix = prefix;
	item.suffix = suffix;
	currentView.watchers[key] = watch({
		async create(json) {
			await currentView.syncCollection(key, json.item, createMethod);
			currentView.fire(`${prefix}create${suffix}`, json.item, json);
		},
		async delete(json) {
			await currentView.removeIndex(key, json.item.id);
			currentView.fire(`${prefix}delete${suffix}`, json.item, json);
		},
		async read(json) {
			await currentView.syncCollection(key, json.items, readMethod);
			currentView.fire(`${prefix}read${suffix}`, json.item, json);
		},
		async update(json) {
			await currentView.syncCollection(key, json.item, createMethod);
			currentView.fire(`${prefix}update${suffix}`, json.item, json);
		},
	}, item.options);
};
const removeInstance = function(currentView, css) {
	cssUnrender(css);
	each(currentView.watchers, (item, key) => {
		item.stop();
		item[key] = null;
	});
};
const onrenderInstance = function(currentView, css) {
	cssRender(css);
	if (currentView.watchers) {
		each(currentView.watchers, (item) => {
			item.start();
		});
	}
};
export const buildComponentEvents = function(componentConfig) {
	const {
		css,
		watchers,
	} = componentConfig;
	const thisComponent = this;
	thisComponent.watchers = (watchers) ? watchers(thisComponent) : {};
	if (thisComponent.watchers) {
		each(thisComponent.watchers, (item, key) => {
			createWatchers(thisComponent, item, key);
		});
	}
	thisComponent.on({
		multi(cmpntEvent, ...args) {
			console.log(cmpntEvent, ...args);
			return multiEvent(this, cmpntEvent, ...args);
		},
		render() {
			return onrenderInstance(this, css);
		},
		teardown() {
			return removeInstance(this, css);
		},
	});
};
const onConstruct = function(componentConfig) {
	const sourceConstruct = componentConfig.onconstruct;
	componentConfig.onconstruct = function(...args) {
		apply(buildComponentEvents, this, [componentConfig, ...args]);
		if (sourceConstruct) {
			return apply(sourceConstruct, this, args);
		}
	};
	const sourceRender = componentConfig.onrender;
	componentConfig.onrender = function(...args) {
		if (sourceRender) {
			return apply(sourceRender, this, args);
		}
	};
};
export default onConstruct;
