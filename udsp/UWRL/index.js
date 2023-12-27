import {
	initialString,
	isPlainObject,
	isString,
	jsonParse,
	restString,
	stringify
} from '@universalweb/acid';
const ipRegex = /^\b(?:\d{1,3}\.){3}\d{1,3}\b$/;
class UWRL {
	constructor(urlOriginal, paramaters) {
		let url = (urlOriginal.includes('uw://')) ? urlOriginal : `uw://${urlOriginal}`;
		if (paramaters) {
			if (isPlainObject(paramaters)) {
				this.paramaters = paramaters;
				this.params = stringify(paramaters);
			} else if (isString(paramaters)) {
				this.params = paramaters;
				this.paramaters = jsonParse(this.params);
			}
		} else {
			const jsonStringStartIndex = url.indexOf('{');
			if (jsonStringStartIndex !== -1) {
				url = urlOriginal.substring(0, jsonStringStartIndex);
				if (jsonStringStartIndex) {
					this.params = urlOriginal.substring(jsonStringStartIndex, urlOriginal.length);
					try {
						this.paramaters = jsonParse(this.params);
					} catch {
						this.paramaters = {};
					}
				}
			}
		}
		const urlObject = new URL(url);
		if (this.paramaters) {
			if (this.paramaters['#']) {
				this.hash = this.paramaters['#'];
			}
			if (this.paramaters[':']) {
				this.account = this.paramaters[':'][0];
				this.password = this.paramaters[':'][1];
			}
		} else {
			this.params = urlObject.search;
			this.parameters = urlObject.searchParams;
		}
		this.url = url;
		this.origin = `${urlObject.protocol}//${urlObject.host}`;
		this.port = urlObject.port;
		this.host = urlObject.host;
		this.hostname = urlObject.hostname;
		if (ipRegex.test(this.hostname)) {
			this.ip = this.hostname;
		}
		this.protocol = urlObject.protocol;
	}
	get search() {
		return this.paramaterString;
	}
	get searchParams() {
		return this.parameters;
	}
	get href() {
		return this.url;
	}
	hash = '';
	isUWRL = true;
}
export function uwrl(...args) {
	return new UWRL(...args);
}
// Supports Username Password and URL Fragments
// Server can opt in to get the URL fragments
// fragments are turned into client side state tracking
// const uwri = new UWRL('uw://localhost:8080/path/to/resource{"query":"value", "#": "fragment", ":": ["username", "password"]}');
// console.log(uwri);
