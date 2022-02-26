import app from './app.js';
import { request } from './request.js';
const {
	utility: {
		assign,
		cnsl,
		eachAsync,
		isString,
		hasValue,
		isRegExp,
		drop,
	},
} = app;
cnsl('Initializing watchers module.', 'notify');
export class Watcher {
	static containerRegex = [];
	static containerPrimary = {};
	static status = true;
	static start() {
		Watcher.status = true;
	}
	static stop() {
		Watcher.status = false;
	}
	static async update(json) {
		console.log(json);
		if (!Watcher.status || !json) {
			return;
		}
		const type = json.type;
		const levelObject = Watcher.containerPrimary[type] || Watcher.containerPrimary[json.name];
		await eachAsync(Watcher.containerRegex, async (watcher) => {
			if (watcher.regex.test(type)) {
				return watcher(json);
			}
		});
		await eachAsync(levelObject, async (watcher) => {
			return watcher(json);
		});
	}
	constructor(eventName, callback) {
		if (isString(eventName)) {
			if (!Watcher.containerPrimary[eventName]) {
				Watcher.containerPrimary[eventName] = [];
			}
			this.container = Watcher.containerPrimary[eventName];
		} else if (isRegExp(eventName)) {
			this.container = Watcher.containerRegex;
		}
		this.callback = callback.bind(this);
		this.start();
	}
	isWatcher = true;
	callback;
	id;
	active;
	container;
	start() {
		if (!hasValue(this.id)) {
			this.id = this.container.push(this) - 1;
			this.active = true;
		}
	}
	stop() {
		if (hasValue(this.id)) {
			drop(this.container, this.id);
			this.id = null;
			this.active = false;
		}
	}
}
export function watch(...args) {
	return new Watcher(...args);
}
export const push = (requestName, data) => {
	return request({
		data,
		id: '_',
		request: requestName,
	});
};
assign(app.events, {
	_(json) {
		return Watcher.update(json.data);
	}
});
assign(app, {
	push,
	watch,
	Watcher
});
watch('connection', (responseData) => {
	console.log(responseData);
});
