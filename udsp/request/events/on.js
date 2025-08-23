import { each, isString } from '@universalweb/utilitylib';
function addEvent(eventName, callback) {
	if (!this.events[name]) {
		this.events[name] = [];
	}
	this.events[name].push(callback);
}
export async function on(events, eventMethod) {
	const thisObject = this;
	if (isString(events)) {
		addEvent(events, (...args) => {
			return eventMethod.call(thisObject, ...args);
		});
	} else {
		each(events, (callback, eventName) => {
			thisObject.on(eventName, callback);
		});
	}
	return this;
}
