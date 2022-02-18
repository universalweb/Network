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
		mapAsync,
		isFunction,
		apply
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
function getPropertyName(propertyName, options = {}) {
	return propertyName || options.id || app.idProperty || 'id';
}
function getIndexValue(item, propertyName) {
	const indexValue = isPlainObject(item) ? item[propertyName] : item;
	return indexValue;
}
function getItem(context, keypath, indexValue, propertyName) {
	const item = findItem(context.get(keypath), indexValue, propertyName);
	return item;
}
function getIndex(context, keypath, indexValue, propertyName) {
	const index = findIndex(context.get(keypath), indexValue, propertyName);
	return index;
}
function getIndexPath(context, keypath, indexValue, propertyName) {
	const index = findIndex(context.get(keypath), indexValue, propertyName);
	return (index) ? `${keypath}.${index}` : false;
}
// drop dropRight removeBy right
async function setByIndex(context, keypath, item, indexValue, propertyName, addBy = 1) {
	const index = findIndex(context.get(keypath), indexValue, propertyName);
	if (hasValue(index)) {
		return context.splice(`${keypath}.${index}`, index + addBy, 0, ...ensureArray(item));
	} else {
		return context.push(keypath, item);
	}
}
async function setAtIndex(context, keypath, item, indexValue, propertyName) {
	const indexPath = getIndexPath(context.get(keypath), indexValue, propertyName);
	if (hasValue(indexPath)) {
		return context.set(indexPath, item);
	}
}
async function syncItem(context, collection, item, addMethod = 'push', propertyName, mergeArrays, removeMethod) {
	const indexValue = getIndexValue(item, propertyName);
	const index = findIndex(collection, indexValue, propertyName);
	if (index) {
		if (addMethod === 'remove') {
			if (isFunction(removeMethod)) {
				return apply(removeMethod, context, [index, item]);
			}
			return collection.splice(index, 1);
		} else {
			assignDeep(collection[index], item, mergeArrays);
		}
	}
	return collection[addMethod](item);
}
export const extendRactive = {
	async merge(keypath, source = {}, options) {
		const path = assemblePath(keypath, options);
		const target = this.get(path);
		if (hasValue(target)) {
			assignDeep(target, source);
			await this.update(path);
		}
		return target;
	},
	async setAtIndex(keypath, item, propertyNameArg, options) {
		const path = assemblePath(keypath, options);
		const propertyName = getPropertyName(propertyNameArg, options);
		const indexValue = getIndexValue(item, propertyName);
		return setAtIndex(this, path, item, indexValue, propertyName, options);
	},
	async setByIndex(keypath, item, propertyNameArg, positionMod, options) {
		const path = assemblePath(keypath, options);
		const propertyName = getPropertyName(propertyNameArg, options);
		const indexValue = getIndexValue(item, propertyName);
		return setByIndex(this, path, item, indexValue, propertyName, positionMod, options);
	},
	async removeByIndex(keypath, item, propertyNameArg, upto = 1, options) {
		const path = assemblePath(keypath, options);
		const propertyName = getPropertyName(propertyNameArg, options);
		const index = getIndex(this, keypath, item, propertyName, options);
		if (hasValue(index)) {
			return this.splice(path, index, upto);
		}
	},
	getIndexPath(keypath, item, propertyNameArg, options) {
		const path = assemblePath(keypath, options);
		const propertyName = getPropertyName(propertyNameArg, options);
		const indexValue = getIndexValue(item, propertyName);
		return getIndexPath(this, path, indexValue, propertyName, options);
	},
	async clearArray(keypath, options) {
		const path = assemblePath(keypath, options);
		const target = this.get(path);
		app.log(path, target);
		if (isArray(target)) {
			clear(target);
			await this.update(path);
		} else {
			app.log(`Attempted to clear none array at ${keypath}`);
		}
		return target;
	},
	getItem(keypath, indexMatch, propertyNameArg, options) {
		const path = assemblePath(keypath, options);
		const propertyName = getPropertyName(propertyNameArg, options);
		const indexValue = getIndexValue(indexMatch, propertyName);
		return getItem(this, path, indexValue, propertyName, options);
	},
	getIndex(keypath, indexMatch, propertyNameArg, options) {
		const path = assemblePath(keypath, options);
		const propertyName = getPropertyName(propertyNameArg, options);
		const indexValue = getIndexValue(indexMatch, propertyName);
		return getIndex(this, path, indexValue, propertyName, options);
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
	async syncItem(keypath, item, options = {}) {
		const {
			addMethod,
			id,
			mergeArrays,
			removeMethod
		} = options;
		const path = assemblePath(keypath, options);
		const collection = this.get(path);
		const propertyName = getPropertyName(id, options);
		app.log(item, path, collection, propertyName);
		await syncItem(this, collection, item, addMethod, propertyName, mergeArrays, removeMethod);
		return this.update(path);
	},
	async syncCollection(keypath, items, options = {}) {
		const source = this;
		app.log(keypath, items, options);
		const {
			addMethod,
			id,
			mergeArrays,
			removeMethod
		} = options;
		const path = assemblePath(keypath, options);
		const propertyName = getPropertyName(id, options);
		const collection = this.get(path);
		let results;
		console.log(source, path, collection, items, addMethod, propertyName, mergeArrays, removeMethod);
		if (isArray(items)) {
			results = await mapAsync(items, async (item) => {
				return syncItem(source, collection, item, addMethod, propertyName, mergeArrays, removeMethod);
			});
		} else {
			results = await syncItem(source, collection, items, addMethod, propertyName, mergeArrays, removeMethod);
		}
		this.update(path);
		return results;
	},
	async toggleByIndex(keypath, item, propertyNameArg, options) {
		const path = assemblePath(keypath, options);
		const propertyName = getPropertyName(propertyNameArg, options);
		const indexValue = getIndexValue(item, propertyName);
		const indexPath = getIndexPath(this, path, indexValue, propertyName);
		if (hasValue(indexPath)) {
			await this.toggle(indexPath);
		}
	}
};
assign(Ractive.prototype, extendRactive);
