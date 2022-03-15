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
	static async update(pushUpdate) {
		console.log(pushUpdate);
		const { body } = pushUpdate;
		if (!Watcher.status || !body) {
			return;
		}
		const {
			type,
			path
		} = body;
		const levelObject = Watcher.containerPrimary[type] || Watcher.containerPrimary[path];
		await eachAsync(Watcher.containerRegex, async (watcher) => {
			if (watcher.eventName.test(type) || watcher.eventName.test(path)) {
				return watcher.eventAction(body);
			}
		});
		if (levelObject) {
			await eachAsync(levelObject, async (watcher) => {
				return watcher.eventAction(body);
			});
		}
	}
	constructor(eventName, eventAction) {
		if (isString(eventName)) {
			if (!Watcher.containerPrimary[eventName]) {
				Watcher.containerPrimary[eventName] = [];
			}
			this.eventType = 'string';
		} else if (isRegExp(eventName)) {
			this.eventType = 'regex';
		}
		this.eventName = eventName;
		this.eventAction = eventAction.bind(this);
		this.start();
	}
	container() {
		if (this.eventType === 'string') {
			return Watcher.containerPrimary[this.eventName];
		} else if (this.eventType === 'regex') {
			return Watcher.containerRegex;
		}
	}
	isWatcher = true;
	eventAction;
	id;
	active;
	start() {
		if (!hasValue(this.id)) {
			this.id = this.container().push(this) - 1;
			this.active = true;
		}
	}
	stop() {
		if (hasValue(this.id)) {
			drop(this.container(), this.id);
			this.id = null;
			this.active = false;
		}
	}
}
export function watch(...args) {
	return new Watcher(...args);
}
export const push = (requestName, body) => {
	return request({
		body,
		id: '_',
		request: requestName,
	});
};
assign(app.events, {
	_(pushUpdate) {
		return Watcher.update(pushUpdate);
	}
});
assign(app, {
	push,
	watch,
	Watcher
});
