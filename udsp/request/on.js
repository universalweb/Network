import { each } from '@universalweb/acid';
export async function on(events) {
	const thisAsk = this;
	each(events, (item, propertyName) => {
		thisAsk.events[propertyName] = (data) => {
			return item.call(thisAsk, data);
		};
	});
}
