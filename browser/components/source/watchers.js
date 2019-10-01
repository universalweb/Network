import app from './app';
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
const watchers = {};
const watchersRegex = [];
class RegexWatcher {
	constructor(type, callable) {
		callable.regex = type;
		this._ = {
			isWatcher: true,
		};
		this.callable = callable;
		this.number = watchersRegex.push(callable) - 1;
	}
	start() {
		if (!hasValue(this.number)) {
			this.number = watchersRegex.push(this.callable) - 1;
		}
	}
	stop() {
		if (hasValue(this.number)) {
			drop(watchersRegex, this.number);
			this.number = null;
		}
	}
}
const onRegex = (type, callable) => {
	return new RegexWatcher(type, callable);
};
class StringWatcher {
	constructor(type, callable, root) {
		this._ = {
			isWatcher: true,
		};
		this.root = () => {
			return root;
		};
		this.type = type;
		if (!watchers[type]) {
			watchers[type] = [];
		}
		const levelObject = watchers[type];
		this.number = levelObject.push(callable) - 1;
	}
	start() {
		if (!hasValue(this.number)) {
			this.number = watchers[this.type].push(this.callable) - 1;
		}
	}
	stop() {
		if (hasValue(this.number)) {
			drop(watchersRegex, this.number);
			this.number = null;
		}
	}
}
const onString = (type, callable, root) => {
	return new StringWatcher(type, callable, root);
};
class CollectionWatcher {
	constructor(object, settings) {
		const root = this;
		root._ = {
			isWatcher: true,
		};
		const watching = [];
		const prefix = (settings.prefix) ? `${settings.prefix}.` : '';
		const suffix = (settings.suffix) ? `.${settings.suffix}` : '';
		eachObject(object, (item, key) => {
			watching.push(onString(`${prefix}${key}${suffix}`, item, root));
		});
		root.watching = watching;
	}
	start() {
		eachArray(this.watching, (item) => {
			item.start();
		});
	}
	stop() {
		eachArray(this.watching, (item) => {
			item.stop();
		});
	}
}
const onCollection = (object, settings) => {
	return new CollectionWatcher(object, settings);
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
const watcherUpdate = async (json) => {
	if (!watch.status || !json) {
		return;
	}
	const {
		body
	} = json;
	if (!body) {
		return;
	}
	const type = body.type;
	const subscribers = [];
	const levelObject = watchers[type];
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
		eachAsync(subscribers, (watcherObject) => {
			return watcherObject.load(body);
		});
	}
};
assign(app, {
	watch,
	watchers,
	watcherUpdate
});
