import { each, isString } from '@universalweb/acid';
export async function on(events, eventMethod) {
	const thisObject = this;
	if (isString(events)) {
		this.events[events] = (data) => {
			return eventMethod.call(thisObject, data);
		};
	} else {
		each(events, (item, propertyName) => {
			thisObject.events[propertyName] = (data) => {
				return item.call(thisObject, data);
			};
		});
	}
	return this;
}
