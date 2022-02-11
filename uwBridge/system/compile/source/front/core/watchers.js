import app from './app.js';
import { request } from './request.js';
const {
	utility: {
		assign,
		cnsl,
		compactMapArray,
		isEmpty,
		eachAsync,
		eachObject,
		eachArray,
		isString,
		isPlainObject,
		hasValue,
		drop
	},
} = app;
cnsl('Initilizing watchers module.', 'notify');
export const watchers = {};
const watchersRegex = [];
const onRegex = (type, callable) => {
	const watchObject = {};
	callable.regex = type;
	let number = watchersRegex.push(callable) - 1;
	assign(watchObject, {
		_: {
			isWatcher: true,
		},
		callable,
		start() {
			if (!hasValue(number)) {
				number = watchersRegex.push(callable) - 1;
			}
		},
		stop() {
			if (hasValue(number)) {
				drop(watchersRegex, number);
				number = null;
			}
		},
	});
	return watchObject;
};
const onString = (type, callable) => {
	const watchObject = {};
	if (!watchers[type]) {
		watchers[type] = [];
	}
	const levelObject = watchers[type];
	let number = levelObject.push(callable) - 1;
	assign(watchObject, {
		_: {
			isWatcher: true,
		},
		callable,
		start() {
			if (!hasValue(number)) {
				number = levelObject.push(callable) - 1;
			}
		},
		stop() {
			if (hasValue(number)) {
				drop(levelObject, number);
				number = null;
			}
		},
	});
	return watchObject;
};
const onCollection = (object, settings) => {
	const watching = [];
	const prefix = (settings.prefix) ? `${settings.prefix}.` : '';
	const suffix = (settings.suffix) ? `.${settings.suffix}` : '';
	const watchCollection = {
		_: {
			isWatcher: true,
		},
		start() {
			eachArray(watching, (item) => {
				item.start();
			});
		},
		stop() {
			eachArray(watching, (item) => {
				item.stop();
			});
		},
		watching,
	};
	eachObject(object, (item, key) => {
		watching.push(onString(`${prefix}${key}${suffix}`, item, settings));
	});
	return watchCollection;
};
export const watch = (type, callable) => {
	let method;
	if (isString(type)) {
		method = onString;
	} else if (isPlainObject(type)) {
		method = onCollection;
	} else {
		method = onRegex;
	}
	return method(type, callable);
};
watch.status = true;
watch.start = () => {
	watch.status = true;
};
watch.stop = () => {
	watch.status = null;
};
const onUpdate = async (json) => {
	if (!watch.status || !json) {
		return;
	}
	const type = json.type;
	const subscribers = [];
	const levelObject = watchers[type] || watchers[json.name];
	const regexSubscribers = compactMapArray(watchersRegex, (item) => {
		if (item.regex.test(type)) {
			return item;
		}
	});
	if (!isEmpty(regexSubscribers)) {
		subscribers.push(...regexSubscribers);
	}
	if (levelObject) {
		subscribers.push(...levelObject);
	}
	console.log(subscribers);
	if (subscribers.length) {
		eachAsync(subscribers, (watcher) => {
			return watcher(json, watcher);
		});
	}
};
export const push = (requestName, data) => {
	return request({
		data,
		id: '_',
		request: requestName,
	});
};
assign(app.events, {
	_(json) {
		return onUpdate(json.data);
	}
});
assign(app, {
	push,
	watch,
	watchers,
	watchersRegex
});
