import { jsonParse, isTrue } from '@universalweb/acid';
import { decode } from 'msgpackr';
export class UWResponse {
	constructor(head, data, options) {
		this.head = head;
		this.dataBuffer = data;
	}
	get data() {
		if (this.compiledDataAlready) {
			return this.compiledData;
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
	toString(cache) {
		if (cache) {
			if (this.toStringCached) {
				return this.toStringCached;
			}
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
