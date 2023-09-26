import {
	promise, assign, omit, eachArray,
	stringify, get, isBuffer,
	isPlainObject, isArray, isMap, construct,
	each, hasLength, hasValue, UniqID
} from '@universalweb/acid';
import { decode, encode } from 'msgpackr';
import {
	failed,
	info,
	msgReceived,
	msgSent
} from '#logs';
export class Base {
	constructor(source, options) {
		this.processConfig(source, options);
	}
	processConfig(source, options) {
		if (source.isAsk || source.isReply) {
			const {
				head,
				method,
				parameters,
				path,
				incomingData,
				status,
				type,
			} = source;
			this.source = function() {
				return source;
			};
			return this.construct(incomingData, {
				head,
				method,
				parameters,
				path,
				status,
				type,
			});
		} else {
			return this.construct(source, options);
		}
	}
	construct(path, options = {}) {
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
			params,
			url
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
		if (hasValue(path)) {
			this.path = path;
		} else if (hasValue(url)) {
			this.path = url;
		}
		if (hasValue(parameters)) {
			this.parameters = parameters;
		} else if (hasValue(params)) {
			this.parameters = params;
		}
	}
}
