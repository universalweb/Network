import { eachAsyncArray, construct } from 'Acid';
class State {
	constructor(type, existingState) {
		this.type = type;
		this.utility = require('Acid');
	}
	modules = ['console', 'msgpack', 'file', 'crypto', 'certificate'];
	getUtil() {
		const thisClass = this;
		eachAsyncArray(this.modules, async (item) => {
			const imported = await import(`../utilities/${item}/`);
			await imported(thisClass);
		});
	}
}
function state(...args) {
	return construct(State, args);
}
export { State };
export default state;
