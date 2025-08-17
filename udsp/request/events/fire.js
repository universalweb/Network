import { eachArray } from '@universalweb/acid';
export async function fire(eventName, ...args) {
	const events = this.events[eventName];
	eachArray(events, async (callback) => {
		await callback(...args);
	});
}
