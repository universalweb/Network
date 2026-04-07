import {
	eachArray, eachObject,
	hasValue, isArray, isMap, isPlainObject, isString, isUndefined,
} from '@universalweb/utilitylib';
export async function getState(key) {
	if (!key) {
		return this.getAll();
	}
	if (isUndefined(key)) {
		return this.getAll();
	}
	if (isString(key)) {
		return this.STATE.get(key);
	}
	if (isArray(key)) {
		const result = {};
		eachArray(key, (value) => {
			result[value] = this.STATE.get(value);
		});
		return result;
	}
	if (isPlainObject(key)) {
		eachObject(key, (value, stateKey) => {
			key[stateKey] = this.STATE.get(stateKey);
		});
		return key;
	}
}
export async function setState(key, value) {
	if (!key) {
		console.warn('No key provided to setState');
		return this;
	}
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
	if (isPlainObject(key) && !value) {
		eachObject(key, (subValue, subKey) => {
			if (this.STATE.has(subKey) && hasValue(subValue)) {
				this.STATE.set(subKey, subValue);
			}
		});
	}
	return this;
}
export async function pluck(key, target = {}) {
	if (isPlainObject(key)) {
		for (const stateKey of Object.keys(key)) {
			target[stateKey] = await this.get(stateKey);
		}
	}
	if (isString(key)) {
		target[key] = await this.get(key);
	}
	return target;
}
export async function getAll() {
	const mapIter = this.STATE.entries();
	const objectMap = {};
	this.STATE.forEach((value, key) => {
		objectMap[key] = value;
	});
	return objectMap;
}
export async function zeroBuffers() {
	const {
		master_seed, master_key, master_nonce,
	} = await this.getAll();
	if (master_seed) {
		master_seed.fill(0);
	}
	if (master_key) {
		master_key.fill(0);
	}
	if (master_nonce) {
		master_nonce.fill(0);
	}
	return this;
}
export async function exportObject() {
	return this.getAll();
}
export async function importObject(source) {
	await this.set(source);
	return this;
}
export default {
	get: getState,
	set: setState,
	pluck,
	getAll,
	zeroBuffers,
	exportObject,
	importObject,
};
