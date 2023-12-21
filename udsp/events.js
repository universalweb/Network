import {
	isPlainObject,
	each,
	isArray,
	assign,
	invokeArray,
	eachArray
} from '@universalweb/acid';
import { imported } from '#logs';
export async function triggerEvent(events, eventName, primaryObject, arg) {
	const eventArray = events.get(eventName);
	if (eventArray) {
		invokeArray(eventArray, primaryObject, arg);
	}
}
async function addListener(events, eventName, eventMethod) {
	const eventArray = events.get(eventName);
	if (eventArray) {
		eventArray.push(eventMethod);
	} else {
		events.set(eventName, [eventMethod]);
	}
	console.log('Added Event', eventName);
}
export async function createEvent(events, eventName, eventMethod) {
	if (isPlainObject(eventName)) {
		return each(eventName, (childEventMethod, childEventName) => {
			addListener(events, childEventName, childEventMethod);
		});
	}
	return addListener(events, eventName, eventMethod);
}
async function removeListener(events, eventName, eventMethod) {
	const eventArray = events.get(eventName);
	if (eventArray) {
		if (eventArray.length) {
			const index = eventArray.indexOf(eventMethod);
			if (index > -1) {
				eventArray.splice(index, 1);
			}
		} else {
			events.delete(eventName);
		}
	}
}
export async function removeEvent(events, eventName, eventMethod) {
	if (isPlainObject(eventName)) {
		return each(eventName, (childEvnt, childEvntName) => {
			removeListener(events, childEvntName, childEvnt);
		});
	}
	return removeListener(events, eventName, eventMethod);
}
