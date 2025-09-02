// REFER TO eventHandling documentation for more details!
import { EventEmitter } from 'node:events';
export function setupEventEmitter(evnt, ...args) {
	this.removeAllListeners(evnt);
	this.events = new EventEmitter();
	return this;
}
// EMIT EVENT IS UNIQUE AND INCLUDES THE 'THIS' CONTEXT
export function emitEvent(evnt, ...args) {
	if (this.hasEvent(evnt)) {
		this.logInfo('emit', evnt, ...args);
		this.events.emit(evnt, this, ...args);
	}
	return this;
}
export function on(evnt, callback) {
	this.events.on(evnt, callback);
	return this;
}
export function off(evnt, callback) {
	if (callback) {
		this.events.removeListener(evnt, callback);
	} else {
		this.events.removeAllListeners(evnt);
	}
	return this;
}
export function once(evnt, callback) {
	this.events.once(evnt, callback);
	return this;
}
// Expose other useful EventEmitter methods
export function listenerCount(evnt) {
	return this.events.listenerCount(evnt);
}
export function hasEvent(evnt) {
	return this.events.listeners(evnt).length > 0;
}
export function removeAllListeners(evnt) {
	this.events?.removeAllListeners(evnt);
	return this;
}
const eventMethods = {
	setupEventEmitter,
	emitEvent,
	on,
	off,
	hasEvent,
	once,
	listenerCount,
	removeAllListeners,
};
export default eventMethods;
