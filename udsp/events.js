import {
	assign,
	each,
	eachArray,
	invokeArray,
	isArray,
	isPlainObject
} from '@universalweb/acid';
export async function triggerEvent(events, eventName, thisBind, ...args) {
	const eventArray = events.get(eventName);
	if (eventArray) {
		const eventArrayLength = eventArray.length;
		const callbackArray = [];
		if (thisBind) {
			for (let index = 0; index < eventArrayLength; index++) {
				callbackArray[index] = eventArray[index].call(thisBind, ...args);
			}
		} else {
			for (let index = 0; index < eventArrayLength; index++) {
				callbackArray[index] = eventArray[index](...args);
			}
		}
		return Promise.all(callbackArray);
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
