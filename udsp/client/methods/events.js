import { createEvent, removeEvent, triggerEvent } from '#udsp/events';
export async function on(...args) {
	return createEvent(this.events, ...args);
}
export async function off(...args) {
	return removeEvent(this.events, ...args);
}
export async function fire(eventName, ...args) {
	return triggerEvent(this.events, eventName, this, ...args);
}
