import app from '../app';
import multiEvent from './multiEvent';
import preventDefault from './preventDefault';
import { cssRender, cssUnrender } from './css';
const {
	watch,
	utility: {
		map,
		each,
		get,
		ifInvoke
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
		delete(json) {
			currentView.removeIndex(key, json.item.id);
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
export const constructEvent = function(componentConfig, componentEvent, sourceConstruct) {
	const {
		css,
		watchers,
	} = componentConfig;
	const componentEventRactive = componentEvent.ractive;
	const componentModel = componentConfig.model;
	const sourceOn = componentEventRactive.on.bind(componentEventRactive);
	if (sourceConstruct) {
		sourceConstruct(componentEvent, componentEventRactive);
	}
	if (componentModel) {
		app.navState = componentEvent.ractive;
	}
	componentEventRactive.onRaw = (componentEvt) => {
		componentEvt.source = componentEvt.ractive;
		return sourceOn(componentEvt);
	};
	componentEventRactive.on = (eventName, eventListener) => {
		console.log(eventName, eventListener);
		if (eventListener) {
			return sourceOn(eventName, preventDefault(eventListener));
		} else {
			return sourceOn(map(eventName, preventDefault));
		}
	};
	each(app.componentMethods, (item) => {
		item(componentEventRactive, componentConfig);
	});
	componentEventRactive.watchers = (watchers) ? watchers(componentEventRactive) : {};
	if (componentEventRactive.watchers) {
		each(componentEventRactive.watchers, (item, key) => {
			createWatchers(componentEventRactive, item, key);
		});
	}
	componentEventRactive.on({
		multi(cmpntEvent, ...args) {
			console.log(cmpntEvent, ...args);
			return multiEvent(componentEventRactive, cmpntEvent, ...args);
		},
		render() {
			onrenderInstance(componentEventRactive, css);
		},
		teardown() {
			removeInstance(componentEventRactive, css);
		},
	});
};
const onConstruct = (componentConfig) => {
	const sourceConstruct = componentConfig.onconstruct;
	componentConfig.onconstruct = function(componentEvent) {
		componentEvent.source = this;
		constructEvent(componentConfig, componentEvent, sourceConstruct);
	};
	const sourceRender = componentConfig.onrender;
	componentConfig.onrender = function(componentEvent) {
		componentEvent.source = this;
		ifInvoke(sourceRender, componentEvent);
	};
};
export default onConstruct;
