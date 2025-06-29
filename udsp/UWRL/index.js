//  EURL: Enhanced Universal Resource Locator
import {
	assign,
	initialString,
	isPlainObject,
	isString,
	jsonParse,
	restString,
	stringify
} from '@universalweb/acid';
import {
	convertClassicalParams,
	getFullURL,
	hasPercentEncoding,
	ipRegex
} from './utils.js';
import { getSchemeName, getSchemeNameAndDelimiter } from './getScheme.js';
import { extractAndValidateJson } from './extractJSON.js';
class UWRL {
	constructor(urlOriginal, parameters, baseURL) {
		this.originalURL = urlOriginal;
		this.baseURL = baseURL;
		this.setURLObject();
		const urlObject = this.urlObject;
		if (parameters) {
			this.setParameters(parameters);
		}
		if (ipRegex.test(this.hostname)) {
			this.ip = this.hostname;
		}
	}
	setURLObject() {
		const urlObject = getFullURL(this.originalURL, this.baseURL);
		this.urlObject = urlObject;
		this.url = urlObject.href;
		if (urlObject.origin !== 'null') {
			this.origin = urlObject.origin;
		}
		if (urlObject.port?.length) {
			this.port = urlObject.port;
		}
		if (urlObject.hostname?.length) {
			this.hostname = urlObject.hostname;
		}
		if (urlObject.protocol?.length) {
			this.protocol = urlObject.protocol;
		}
		if (urlObject.pathname?.length) {
			this.pathname = urlObject.pathname;
		}
		this.host = urlObject.host;
		this.setPercentEncodedParameters();
	}
	setParameters(parameters) {
		if (parameters) {
			if (isPlainObject(parameters)) {
				assign(this.parameters, parameters);
			} else if (isString(parameters)) {
				const extractJSON = extractAndValidateJson(parameters);
				if (extractJSON) {
					assign(this.parameters, extractJSON);
				}
			}
		}
	}
	setPercentEncodedParameters() {
		if (this?.urlObject?.searchParams) {
			const classicalParams = convertClassicalParams(this.urlObject.searchParams);
			if (classicalParams) {
				assign(this.parameters, classicalParams);
			}
		}
	}
	extractJSONParameters() {
		const jsonObject = extractAndValidateJson(this.originalURL);
		if (jsonObject) {
			this.parameters = jsonObject;
		}
	}
	processParameters(parameters) {
		this.setHash();
		this.setAccount();
	}
	setHash() {
		if (this.parameters['#']) {
			this.hash = this.parameters['#'];
		}
	}
	setAccount() {
		if (this.parameters[':']) {
			this.account = this.parameters[':'][0];
			this.password = this.parameters[':'][1];
		}
	}
	get searchParams() {
		return this.parameters;
	}
	get search() {
		return this.search;
	}
	get href() {
		return this.url;
	}
	hash = '';
	isUWRL = true;
	parameters = {};
}
export function uwrl(...args) {
	return new UWRL(...args);
}
export default uwrl;
// const uwri = uwrl('://localhost:8080/path/to/resource{"query":"value", "#": "fragment", ":": ["username", "password"]}');
// console.log(uwri);
// console.log(uwrl('://localhost:8080/path/to/resource["username", "password"]'));
// console.log(uwrl('example.com/path/to/resource?query=hello%20world&limit=10&sort=asc', {
// 	example: 'value'
// }));
