import {
	UniqID,
	assign,
	construct,
	each,
	eachArray,
	get,
	hasLength,
	hasValue,
	isArray,
	isBuffer,
	isMap,
	isPlainObject,
	omit,
	promise,
	stringify
} from '@universalweb/acid';
import { decode, encode } from '#utilities/serialize';
import {
	failed,
	info,
	msgReceived,
	msgSent
} from '#logs';
export class Base {
	constructor(config) {
		if (config) {
			this.construct(config);
		}
	}
	construct(config) {
		const {
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
			source,
			method
		} = config;
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
		if (source) {
			this.source = function() {
				return source;
			};
		}
	}
}
