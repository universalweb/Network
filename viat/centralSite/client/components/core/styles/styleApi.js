import { eachArray, eachObject, hasOwn, isArray, isString } from '../utilities.js';
import { assertStaticStyles } from '../debug/assertions.js';
import { collectClassChain } from '../attrs/staticConfig.js';
import { loadSheet } from './css-loader.js';
const sheetCache = new Map();
export function styleSheet(source, metaUrl) {
	if (isArray(source)) {
		return Promise.all(source.map((sourceItem) => {
			return styleSheet(sourceItem, metaUrl);
		}));
	}
	const key = metaUrl ? new URL(source, metaUrl).toString() : source;
	if (sheetCache.has(key)) {
		return sheetCache.get(key);
	}
	if (metaUrl) {
		const sheetPromise = loadSheet(key);
		sheetCache.set(key, sheetPromise);
		return sheetPromise;
	}
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(source);
	sheetCache.set(key, sheet);
	return sheet;
}
export async function compileStyles(ComponentClass) {
	const chain = collectClassChain(ComponentClass);
	const merged = new Map();
	eachArray(chain, (classRef) => {
		if (!hasOwn(classRef, 'styles')) {
			return;
		}
		assertStaticStyles(classRef.styles, classRef.name);
		eachObject(classRef.styles, (key, value) => {
			merged.set(key, {
				owner: classRef,
				value,
			});
		});
	});
	const ordered = [];
	const tasks = [];
	merged.forEach((entry, key) => {
		const {
			owner,
			value,
		} = entry;
		if (value === null || value === undefined) {
			return;
		}
		if (value instanceof CSSStyleSheet) {
			ordered.push({
				key,
				sheet: value,
			});
			return;
		}
		if (!hasOwn(owner, 'url')) {
			throw new TypeError(`${owner.name}.styles.${key}: relative path "${value}" requires \`static url = import.meta.url\` on ${owner.name}.`);
		}
		const slot = {
			key,
			sheet: null,
		};
		ordered.push(slot);
		tasks.push(styleSheet(value, owner.url).then((sheet) => {
			slot.sheet = sheet;
		}));
	});
	await Promise.all(tasks);
	const map = new Map();
	eachArray(ordered, (slot) => {
		map.set(slot.key, slot.sheet);
	});
	return {
		map,
		array: Object.freeze([...map.values()]),
	};
}
export function ensureCompiledStyles(ComponentClass) {
	if (hasOwn(ComponentClass, 'compiledStylesPromise')) {
		return ComponentClass.compiledStylesPromise;
	}
	const promise = compileStyles(ComponentClass).then((result) => {
		ComponentClass.compiledStyles = result.map;
		ComponentClass.compiledStylesArray = result.array;
		return result;
	});
	Object.defineProperty(ComponentClass, 'compiledStylesPromise', {
		value: promise,
		configurable: true,
		writable: true,
	});
	return promise;
}
export async function applyStyles() {
	const ComponentClass = this.constructor;
	if (this.styleMap) {
		if (this.shadowRoot) {
			this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()];
		}
		return;
	}
	const result = await ensureCompiledStyles(ComponentClass);
	if (!this.shadowRoot) {
		return;
	}
	if (this.styleMap) {
		this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()];
		return;
	}
	this.shadowRoot.adoptedStyleSheets = result.array;
}
export function forkStyleMap() {
	if (this.styleMap) {
		return this.styleMap;
	}
	const compiled = this.constructor.compiledStyles;
	this.styleMap = compiled ? new Map(compiled) : new Map();
	return this.styleMap;
}
export async function resolveStyle(sheetOrPath, baseUrl) {
	if (sheetOrPath instanceof CSSStyleSheet) {
		return sheetOrPath;
	}
	if (!isString(sheetOrPath)) {
		throw new TypeError('addStyle expects CSSStyleSheet or string path.');
	}
	const url = baseUrl ?? this.constructor.url ?? document.baseURI;
	return styleSheet(sheetOrPath, url);
}
export async function addStyle(key, sheetOrPath, baseUrl) {
	if (!isString(key)) {
		throw new TypeError('addStyle: key must be a string.');
	}
	await ensureCompiledStyles(this.constructor);
	const sheet = await this.resolveStyle(sheetOrPath, baseUrl);
	this.forkStyleMap();
	this.styleMap.set(key, sheet);
	if (this.shadowRoot) {
		this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()];
	}
	return sheet;
}
export async function removeStyle(key) {
	if (!isString(key)) {
		throw new TypeError('removeStyle: key must be a string.');
	}
	await ensureCompiledStyles(this.constructor);
	this.forkStyleMap();
	const wasDeleted = this.styleMap.delete(key);
	if (wasDeleted && this.shadowRoot) {
		this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()];
	}
	return wasDeleted;
}
export function hasStyle(key) {
	if (this.styleMap) {
		return this.styleMap.has(key);
	}
	const compiled = this.constructor.compiledStyles;
	if (compiled) {
		return compiled.has(key);
	}
	return false;
}
