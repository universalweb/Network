import app from '../app';
const {
	utility: {
		findIndex,
		hasValue,
		findItem,
		assignDeep,
		ensureArray,
		assign,
		isArray,
		sortNewest,
		sortOldest,
		clear,
		isPlainObject,
		mapAsync
	}
} = app;
function assemblePath(keypath, options = {}) {
	const {
		pathPrefix = '',
		pathSuffix = ''
	} = options;
	return (pathPrefix && `${pathPrefix}.`) + keypath + (pathSuffix && `.${pathSuffix}`);
}
// function assembleAfterIndexPath(keypath, options) {
// 	const {
// 		afterIndex = '',
// 		beforeIndex = ''
// 	} = options;
// 	return (beforeIndex && `${beforeIndex}.`) + keypath + (afterIndex && `.${afterIndex}`);
// }
function getPropertyName(indexName, options = {}) {
	return indexName || app.idProperty || options.idProperty || 'id';
}
function getIndexValue(indexMatchArg, indexNameArg, options) {
	const indexName = getPropertyName(indexNameArg, options);
	const indexMatch = isPlainObject(indexMatchArg) ? indexMatchArg[indexName] : indexMatchArg;
	return indexMatch;
}
function getItem(context, keypath, indexMatchArg, indexNameArg, options = {}) {
	const indexName = getPropertyName(indexNameArg, options);
	const indexMatch = getIndexValue(indexMatchArg, indexNameArg, options);
	const path = assemblePath(keypath, options);
	const item = findItem(context.get(path), indexMatch, indexName);
	return item;
}
function getIndex(context, keypath, indexMatchArg, indexNameArg, options = {}) {
	const indexName = getPropertyName(indexNameArg, options);
	const indexMatch = getIndexValue(indexMatchArg, indexNameArg, options);
	const path = assemblePath(keypath, options);
	const index = findIndex(context.get(path), indexMatch, indexName);
	return hasValue(index) ? index : null;
}
function getOrigin(context, keypath, indexMatchArg, indexNameArg, options = {}) {
	const indexName = getPropertyName(indexNameArg, options);
	const indexMatch = getIndexValue(indexMatchArg, indexNameArg, options);
	const path = assemblePath(keypath, options);
	const item = context.get(path);
	const index = findIndex(item, indexMatch, indexName);
	return {
		index,
		path
	};
}
async function putByIndex(context, keypath, value, indexMatchArg, indexNameArg, options, addBy = 1) {
	const path = assemblePath(keypath, options);
	const indexName = getPropertyName(indexNameArg, options);
	const indexMatch = getIndexValue(indexMatchArg, indexNameArg, options);
	const index = findIndex(path, indexMatch, indexName);
	if (hasValue(index)) {
		return context.splice(path, index + addBy, 0, ...ensureArray(value));
	} else {
		return context.push(path, value);
	}
}
async function setAtIndex(context, keypath, value, indexMatchArg, indexNameArg, options) {
	const path = assemblePath(keypath, options);
	const indexName = getPropertyName(indexNameArg, options);
	const indexMatch = getIndexValue(indexMatchArg, indexNameArg, options);
	const index = findIndex(context.get(path), indexMatch, indexName);
	if (hasValue(index)) {
		return context.set(`${path}.${index}`, value);
	}
}
export const extendRactive = {
	async merge(keypath, source = {}, options) {
		const path = assemblePath(keypath, options);
		const target = this.get(keypath);
		if (hasValue(target)) {
			assignDeep(target, source);
			await this.update(path);
		}
		return target;
	},
	putByIndex(keypath, value, indexMatch, indexName, options, addBy) {
		return putByIndex(this, keypath, value, indexMatch, indexName, options, addBy);
	},
	setAtIndex(keypath, value, indexMatch, indexName, options, addBy) {
		return setAtIndex(this, keypath, value, indexMatch, indexName, options, addBy);
	},
	getOrigin(keypath, indexMatch, indexNameArg, options) {
		return getOrigin(this, keypath, indexMatch, indexNameArg, options);
	},
	appendAtIndex(keypath, indexMatch, value, indexName, amount = 1, options) {
		return putByIndex(this, keypath, value, indexMatch, indexName, options, amount);
	},
	prependAtIndex(keypath, indexMatch, value, indexName, amount = -1, options) {
		return putByIndex(this, keypath, value, indexMatch, indexName, options, amount);
	},
	async clearArray(keypath, options) {
		const path = assemblePath(keypath, options);
		const target = this.get(path);
		if (isArray(path)) {
			clear(path);
			await this.update(path);
		} else {
			app.log(`Attempted to clear none array at ${keypath}`);
		}
		return target;
	},
	getItem(keypath, indexMatch, indexName, options) {
		return getItem(this, keypath, indexMatch, indexName, options);
	},
	getIndex(keypath, indexMatch, indexName, options) {
		return getIndex(this, keypath, indexMatch, indexName, options);
	},
	async removeByIndex(keypath, indexMatchArg, indexNameArg, upto = 1, options) {
		const path = assemblePath(keypath, options);
		const indexName = getPropertyName(indexNameArg, options);
		const index = getIndex(this, keypath, indexMatchArg, indexName, options);
		if (hasValue(index)) {
			return this.splice(path, index, upto);
		}
	},
	async removeIndex(keypath, index, upto = 1, options) {
		const path = assemblePath(keypath, options);
		if (hasValue(index)) {
			return this.splice(path, index, upto);
		}
	},
	async pushByIndex(keypath, value, indexMatch, indexName, options) {
		const path = assemblePath(keypath, options);
		const item = getItem(this, path, indexMatch, indexName, options);
		if (isArray(item)) {
			item.push(value);
		}
		this.update(path);
	},
	async unshiftByIndex(keypath, item, indexMatchArg, indexNameArg, options) {
		const indexName = getPropertyName(indexNameArg, options);
		const index = getIndex(this, keypath, indexMatchArg, indexName, options);
		if (hasValue(index)) {
			const path = assemblePath(`${keypath}.${index}`, options);
			await this.unshift(path, item);
		}
	},
	async shiftByIndex(keypath, indexMatchArg, item, indexNameArg, options) {
		const indexName = getPropertyName(indexNameArg, options);
		const index = getIndex(this, keypath, indexMatchArg, indexName, options);
		if (hasValue(index)) {
			const path = assemblePath(`${keypath}.${index}`, options);
			await this.shift(path);
		}
	},
	async popByIndex(keypath, indexMatchArg, item, indexNameArg, options) {
		const indexName = getPropertyName(indexNameArg, options);
		const index = getIndex(this, keypath, indexMatchArg, indexName, options);
		if (hasValue(index)) {
			const path = assemblePath(`${keypath}.${index}`, options);
			await this.pop(path);
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
	async syncItem(pathOriginal, newValue, indexName, type = 'push', propertyName, options = {}) {
		// app.log(this, pathOriginal, newValue, indexName);
		const path = assemblePath(pathOriginal, options);
		// app.log(path);
		const currentValue = getItem(this, path, newValue, indexName, options);
		if (currentValue) {
			if (type === 'remove') {
				return this.removeByIndex(pathOriginal, newValue, propertyName, indexName);
			} else {
				const {
					mergeArrays = false
				} = options;
				assignDeep(currentValue, newValue, mergeArrays);
				return this.update(path);
			}
		}
		if (extendRactive[type]) {
			return this[type](pathOriginal, newValue, indexName, propertyName, options);
		}
		return this[type](path, newValue);
	},
	async syncCollection(...args) {
		const source = this;
		const [
			pathOriginal, newValues, indexName, type = 'push', propertyName, options = {}
		] = args;
		// app.log(source, pathOriginal, newValues, indexName, type, propertyName, options);
		if (isArray(newValues)) {
			return mapAsync(newValues, async (item) => {
				return source.syncItem(pathOriginal, item, indexName, type, propertyName, options);
			});
		} else {
			return source.syncItem(pathOriginal, newValues, indexName, type, propertyName, options);
		}
	},
	async toggleByIndex(keypath, indexMatch, indexName, options) {
		const path = assemblePath(keypath, options);
		const index = getIndex(keypath, indexMatch, indexName, options);
		if (hasValue(index)) {
			await this.toggle(`${path}.${index}`);
		}
	}
};
assign(Ractive.prototype, extendRactive);
