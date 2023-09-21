import {
	jsonParse, isTrue, construct, hasValue, noValue
} from '@universalweb/acid';
import { decode } from 'msgpackr';
export class UWResponse {
	constructor(source, options) {
		if (source.isAsk) {
			const {
				head,
				method,
				parameters,
				path,
				incomingData,
				status,
				type,
			} = source;
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
	construct(data, options = {}) {
		const {
			head,
			headers,
			params,
			parameters = params,
			method,
			status,
			type,
			url,
			path = url
		} = options;
		this.head = head || {};
		if (hasValue(data)) {
			this.dataBuffer = data;
		}
		this.method = method;
		if (hasValue(status)) {
			this.status = status;
		}
		if (hasValue(path)) {
			this.path = path;
		}
		if (hasValue(type)) {
			this.type = type;
		}
		if (hasValue(parameters)) {
			this.parameters = parameters;
		}
	}
	get data() {
		if (this.compiledDataAlready) {
			return this.compiledData;
		}
		if (noValue(this.dataBuffer)) {
			return undefined;
		}
		const { head: { serialize } } = this;
		const dataConcatinated = Buffer.concat(this.dataBuffer);
		if (serialize) {
			if (isTrue(serialize) || serialize === 0) {
				this.compiledData = decode(dataConcatinated);
			} else if (serialize === 1 || serialize === 'json') {
				this.compiledData = jsonParse(dataConcatinated);
			}
			dataConcatinated.fill(0);
		} else {
			this.compiledData = dataConcatinated;
		}
		this.compiledDataAlready = true;
		return this.compiledData;
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
	toString(cache) {
		if (cache) {
			if (this.toStringCached) {
				return this.toStringCached;
			}
		}
		if (noValue(this.dataBuffer)) {
			return;
		}
		const target = this.data.toString();
		if (cache) {
			this.toStringCached = target;
		}
		return target;
	}
	toJSON(cache) {
		if (cache) {
			if (this.toJSONCached) {
				return this.toJSONCached;
			}
		}
		if (noValue(this.dataBuffer)) {
			return;
		}
		const target = jsonParse(this.data);
		if (cache) {
			this.toJSONCached = target;
		}
		return jsonParse(this.data);
	}
	serialize(cache) {
		if (cache) {
			if (this.serializeCached) {
				return this.serializeCached;
			}
		}
		if (noValue(this.dataBuffer)) {
			return;
		}
		const target = decode(this.data);
		if (cache) {
			this.serializeCached = target;
		}
		return target;
	}
	toObject(cache) {
		if (cache) {
			if (this.toObjectRawCached) {
				return this.toObjectRawCached;
			}
		}
		if (noValue(this.dataBuffer)) {
			return;
		}
		const {
			head,
			data,
			id,
			method,
		} = this;
		const target = {
			head,
			data,
			method
		};
		if (cache) {
			this.toObjectRawCached = target;
		}
		return target;
	}
	isResponse = true;
}
export function uwResponseObject(...args) {
	return construct(UWResponse, args);
}
