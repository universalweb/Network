import {
	promise, assign, omit, eachArray, stringify, get, isBuffer, isPlainObject, isArray, isMap, construct, each, hasLength, hasValue, UniqID
} from '@universalweb/acid';
import { decode, encode } from 'msgpackr';
import {
	failed,
	info,
	msgReceived,
	msgSent
} from '#logs';
export class UWRequest {
	constructor(path, options = {}) {
		const {
			method = 'get',
			parameters,
			data,
			body,
			head,
			headers,
			priority,
			credentials,
			mode,
			cache,
			redirect,
			referrer,
			referrerPolicy,
			integrity,
			keepalive,
			signal,
			domainCertificate,
			profileCertificate,
			params
		} = options;
		if (method) {
			this.method = method;
		}
		if (hasValue(data)) {
			this.data = data;
		} else if (hasValue(body)) {
			this.data = body;
		}
		if (hasValue(head)) {
			this.head = head;
		} else if (hasValue(headers)) {
			this.head = headers;
		}
		if (path) {
			this.path = path;
		}
		if (hasValue(parameters)) {
			this.parameters = parameters;
		} else if (hasValue(params)) {
			this.parameters = params;
		}
	}
	get headers() {
		return this.head;
	}
	get body() {
		return this.data;
	}
	get url() {
		return this.path;
	}
	get params() {
		return this.parameters;
	}
	set headers(value) {
		this.head = value;
	}
	set body(value) {
		this.data = value;
	}
	set url(value) {
		this.path = value;
	}
	set params(value) {
		this.parameters = value;
	}
	isRequest = true;
}
export async function uwRequestObject(source) {
	return construct(UWRequest, omit);
}
