import { createEvent, removeEvent, triggerEvent } from '../../../events.js';
export async function on(eventName, eventMethod) {
	return createEvent(this.events, eventName, eventMethod);
}
export async function off(eventName, eventMethod) {
	return removeEvent(this.events, eventName, eventMethod);
}
export async function fire(eventName, ...args) {
	this.logInfo(`CLIENT EVENT -> ${eventName} - ID:${this.connectionIdString}`);
	return triggerEvent(this.events, eventName, this, ...args);
}
