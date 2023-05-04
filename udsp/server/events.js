import {
	isPlainObject,
	each,
	isArray,
	assign
} from 'Acid';
import { imported } from '#logs';
imported('SERVER Events');
async function addEvent(events, eventName, evntName, evnt) {
	events.set(evntName, evnt);
	console.log('Added Event', evntName);
}
export async function on(evntName, evnt) {
	const { events } = this;
	if (isPlainObject(evntName)) {
		return each(evntName, (childEvnt, childEvntName) => {
			addEvent(events, childEvntName, childEvnt);
		});
	}
	return addEvent(events, evntName, evnt);
}
async function removeEvent(events, evnt, evntName) {
	events.delete(evntName);
}
export async function off(evnts) {
	const { events } = this;
	if (isPlainObject(evnts)) {
		return each(evnts, (evnt, evntName) => {
			removeEvent(events, evntName);
		});
	}
	if (isArray(evnts)) {
		return each(evnts, (evntName) => {
			removeEvent(events, evntName);
		});
	}
	return removeEvent(events, evnts);
}
