import {
	eachObject, hasValue,
	isMap,
} from '@universalweb/utilitylib';
export function getState(key) {
	return this.STATE.get(key);
}
export function setState(key, value) {
	if (value) {
		this.STATE.set(key, value);
		return this;
	}
	if (isMap(key)) {
		for (const [
			subKey,
			subValue,
		] of key) {
			this.STATE.set(subKey, subValue);
		}
		return this;
	}
	eachObject(key, (subValue, subKey) => {
		if (this.STATE.has(subKey) && hasValue(subValue)) {
			this.STATE.set(subKey, subValue);
		}
	});
	return this;
}
export default {
	getState,
	setState,
};
