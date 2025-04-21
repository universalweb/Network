import { hasValue, } from '@universalweb/acid';
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
