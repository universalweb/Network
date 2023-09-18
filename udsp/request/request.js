import {
	promise, assign, omit, eachArray, stringify, get, isBuffer, isPlainObject, isArray, isMap, construct, each, hasLength, hasValue, UniqID
} from '@universalweb/acid';
import { decode, encode } from 'msgpackr';
import {
	failed, info, msgReceived, msgSent
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
		} = options;
		this.method = method;
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
	isRequest = true;
}
export async function uwRequest(source) {
	return construct(UWRequest, omit);
}
