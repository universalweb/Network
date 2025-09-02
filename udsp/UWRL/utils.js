import { appendScheme, getSchemeName, getSchemeNameAndDelimiter } from './getScheme.js';
import { extractAndValidateJson, removeJSON } from './extractJSON.js';
import {
	initialString,
	isPlainObject,
	isString,
	jsonParse,
	restString,
	stringify
} from '@universalweb/utilitylib';
import { base } from 'daisyui/imports.js';
export const ipRegex = /^\b(?:\d{1,3}\.){3}\d{1,3}\b$/;
export function getFullURL(urlString, baseURL, defaultScheme = 'uw') {
	const schemeName = (baseURL) ? getSchemeName(baseURL) : getSchemeName(urlString);
	let target = removeJSON(urlString);
	if (!baseURL) {
		target = appendScheme(target);
	}
	const url = new URL(target, appendScheme(baseURL));
	return url;
}
// Look for % followed by two hex digits
export function hasPercentEncoding(str) {
	const pattern = /%[0-9A-Fa-f]{2}/;
	return pattern.test(str);
}
export function convertClassicalParams(searchParams, target = {}) {
	for (const [
		key,
		value
	] of searchParams) {
		target[key] = value;
	}
	return target;
}
// console.log(getFullURL('/path/to/resource?query=Hello%20World', 'example.com', 'uw'));
