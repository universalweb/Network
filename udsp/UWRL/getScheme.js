// TODO: Add support for different schemes
// Default Binary Universal Web Resource Locator using CBOR given a binary buffer uw:// or buw:// binary-UW
// String Universal Web Resource Locator using text+UTF8 given as euw:// UTF8 supported enhanced URL
// Hex/Base64URLSafe Universal Web Resource Locator using hex or URL Safe base64 string data euw[encoding-base-hex]://
// cuw:// - WWW compatibility UW scheme for backwards compatibility with old URLs
// juw:// - JSON Universal Web Resource Locator using JSON string data
// bsuw:// - BSON - Binary JSON Universal Web Resource Locator using JSON string data
import {
	get, isNotString, isString, noValue
} from '@universalweb/acid';
const schemes = {
	uw: {
		description: 'Binary Universal Web Resource Locator'
	},
	buw: {
		description: 'Binary Universal Web Resource Locator'
	},
	cuw: {
		description: 'WWW compatibility UW scheme for backwards compatibility with old URLs'
	},
	euw: {
		description: 'String Universal Web Resource Locator using text+UTF8'
	},
	juw: {
		description: 'JSON Universal Web Resource Locator using JSON string data'
	},
	bsuw: {
		description: 'BSON - Binary JSON Universal Web Resource Locator using JSON string data'
	},
	viat: {
		description: 'VIAT - cryptocurrency'
	},
	viats: {
		description: 'VIAT - cryptocurrency with string based URL'
	},
	viatb: {
		description: 'VIAT - cryptocurrency with binary based URL'
	}
};
const noSchemeRegex = /^(\/\/|:\/\/)|^(?!.*:\/\/)/;
const schemeRegex = /^([a-zA-Z][a-zA-Z0-9+\-.]+):/;
export function hasEmptyScheme(urlString) {
	if (isNotString(urlString)) {
		return false;
	}
	if (noSchemeRegex.test(urlString)) {
		return true;
	}
	return false;
}
export function getSchemeName(urlString, defaultScheme) {
	if (isNotString(urlString)) {
		return defaultScheme;
	}
	if (noSchemeRegex.test(urlString)) {
		if (defaultScheme && isString(defaultScheme)) {
			return defaultScheme.toLowerCase();
		}
	}
	const match = urlString.match(schemeRegex);
	if (match && match[1]) {
		const schemeMatched = match[1].toLowerCase();
		if (schemes[schemeMatched]) {
			return schemeMatched.toLowerCase();
		}
	} else if (defaultScheme && isString(defaultScheme)) {
		return defaultScheme.toLowerCase();
	}
}
export function getSchemeNameAndDelimiter(urlString, defaultScheme = 'uw') {
	const schemeName = getSchemeName(urlString);
	if (schemeName) {
		if (urlString.includes('://')) {
			return `${schemeName}`;
		}
		return `${schemeName}://`;
	}
	return `${defaultScheme}://`;
}
export function hasSchemeDelimiter(urlString) {
	if (isNotString(urlString)) {
		return false;
	}
	if (urlString.includes('://')) {
		return true;
	}
	return false;
}
export function hasValidScheme(urlString) {
	if (urlString && getSchemeName(urlString)) {
		return true;
	}
	return false;
}
export function appendScheme(urlString, defaultScheme = 'uw') {
	if (!isString(urlString)) {
		return;
	}
	const schemeName = hasValidScheme(urlString);
	if (schemeName) {
		return urlString;
	}
	if (hasSchemeDelimiter(urlString)) {
		return `${defaultScheme}${urlString}`;
	}
	return `${defaultScheme}://${urlString}`;
}
export function hasEmptyOrValidScheme(urlString) {
	return hasEmptyScheme(urlString) || hasValidScheme(urlString);
}
export function getSchemeNameDefault(urlString, defaultScheme = 'uw') {
	return getSchemeName(urlString, defaultScheme);
}
export function getScheme(url, defaultScheme) {
	const schemeName = getSchemeNameDefault(url, defaultScheme);
	if (schemeName) {
		return schemes[schemeName];
	}
	return;
}
export function getSchemeProperty(url, defaultScheme, propertyName) {
	const schemeObject = getScheme(url, defaultScheme);
	if (schemeObject) {
		return get(propertyName, schemeObject);
	}
	return;
}
export function getSchemeMethod(url, defaultScheme) {
	return getSchemeProperty(url, defaultScheme, 'method');
}
export function getSchemeDescription(url, defaultScheme) {
	return getSchemeProperty(url, defaultScheme, 'description');
}
// console.log('getSchemeName', getSchemeName('://example.com'));
// console.log('getSchemeNameDefault', getSchemeNameDefault('://example.com'));
// console.log('getScheme', getScheme('://example.com'));
// console.log('hasValidScheme', hasValidScheme('://example.com'));
// console.log('hasEmptyScheme', hasEmptyScheme('uw://example.com'));
// console.log('hasValidScheme', hasValidScheme('uw://example.com'));
// console.log('hasEmptyOrValidScheme', hasEmptyOrValidScheme('http://example.com'));
// console.log('hasEmptyOrValidScheme', hasEmptyOrValidScheme('uw://example.com'));
// console.log('hasEmptyOrValidScheme', hasEmptyOrValidScheme('://example.com'));
// console.log('getSchemeNameAndDelimiter', getSchemeNameAndDelimiter('://example.com'));
