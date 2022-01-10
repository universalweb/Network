import app from '../app';
const {
	utility: {
		findIndex,
		hasValue,
		get,
		isPlainObject,
		findItem,
		assignDeep,
		ensureArray,
		assign,
		each,
		isArray,
		isEmpty,
		sortNewest,
		sortOldest,
		clear,
	}
} = app;
export const extendRactive = {
	async afterIndex(path, indexMatch, item, indexName) {
		const index = findIndex(this.get(path), indexMatch, indexName);
		if (hasValue(index)) {
			await this.splice(path, index + 1, 0, ...ensureArray(item));
		} else {
			await this.push(path, item);
		}
	},
	async assign(path, mergeObject) {
		const item = this.get(path);
		if (hasValue(item)) {
			assignDeep(item, mergeObject);
			await this.update(path);
			return item;
		}
	},
	async beforeIndex(path, indexMatch, item, indexName) {
		const index = findIndex(this.get(path), indexMatch, indexName);
		if (hasValue(index)) {
			await this.splice(path, index - 1, 0, ...ensureArray(item));
		} else {
			await this.push(path, item);
		}
	},
	async clearArray(path) {
		const arrayToClear = this.get(path);
		if (arrayToClear) {
			clear(arrayToClear);
			await this.update(path);
		}
	},
	findItem(path, indexMatch, indexName) {
		const item = find(this.get(path), indexMatch, indexName);
		if (hasValue(item)) {
			return item;
		}
	},
	getIndex(path, indexMatch, indexName) {
		const index = findIndex(this.get(path), indexMatch, indexName);
		if (hasValue(index)) {
			return index;
		}
	},
	async mergeItem(path, indexMatch, newVal, indexName) {
		const item = findItem(this.get(path), indexMatch, indexName);
		if (hasValue(item)) {
			assignDeep(item, newVal);
			await this.update(path);
			return item;
		}
	},
	async removeIndex(path, indexMatch, indexName) {
		const index = findIndex(this.get(path), indexMatch, indexName);
		if (hasValue(index)) {
			await this.splice(path, index, 1);
		}
	},
	async setIndex(path, indexMatch, item, indexName, optionsArg) {
		const options = optionsArg || {};
		const index = findIndex(this.get(path), indexMatch, indexName);
		if (hasValue(index)) {
			const pathSuffix = (options.pathSuffix) ? `.${options.pathSuffix}` : '';
			await this.set(`${path}.${index}${pathSuffix}`, item);
		} else if (get('conflict', options) === 'insert') {
			await this[get('conflictMethod', options) || 'push'](path, item);
		}
	},
	async sortNewest(path, property) {
		const array = this.get(path);
		sortNewest(array, property, true);
		await this.update(path);
	},
	async sortOldest(path, property) {
		const array = this.get(path);
		sortOldest(array, property, true);
		await this.update(path);
	},
	async syncCollection(path, newValArg, type = 'push', indexName = 'id') {
		const oldVal = this.get(path);
		if (isPlainObject(oldVal)) {
			assignDeep(oldVal, newValArg);
		} else {
			const newVal = ensureArray(newValArg);
			each(newVal, (item) => {
				const oldValItem = findItem(oldVal, item[indexName], indexName);
				if (hasValue(oldValItem)) {
					assign(oldValItem, item);
				} else {
					oldVal[type](item);
				}
			});
		}
		await this.update(path);
	},
	async toggleIndex(path, indexMatchArg, pathSuffixArg, indexName) {
		let indexMatch;
		const arrayCheck = isArray(indexMatchArg);
		if (arrayCheck && !isEmpty(indexMatchArg)) {
			indexMatch = indexMatchArg.shift();
		} else {
			indexMatch = indexMatchArg;
		}
		const index = findIndex(this.get(path), indexMatch, indexName);
		if (hasValue(index)) {
			const pathSuffix = (pathSuffixArg) ? `.${pathSuffixArg}` : '';
			await this.toggle(`${path}.${index}${pathSuffix}`);
		}
		if (arrayCheck && !isEmpty(indexMatchArg)) {
			await this.toggleIndex(path, indexMatchArg, pathSuffixArg, indexName);
		}
	},
	async updateItem(path, indexMatch, react, indexName) {
		const item = findItem(this.get(path), indexMatch, indexName);
		if (hasValue(item)) {
			react(item);
			await this.update(path);
			return item;
		}
	}
};
assign(Ractive.Context, extendRactive);
