import {
	eachObject, jsonParse, isTrue, noValue, assign, clear, hasValue, isUndefined
} from '@universalweb/acid';
import { decode, encode } from '#utilities/serialize';
export const objectDataMethods = {
	getters: {
		data() {
			return this.dataBuffer;
		},
	},
	setters: {
		data(data) {
			this.dataBuffer = data;
		},
	},
	methods: {
		toString(encoding, cache) {
			if (noValue(this.dataBuffer)) {
				return;
			}
			if (cache) {
				if (this.toStringCached) {
					return this.toStringCached;
				}
			}
			const encodingHeader = encoding || this.head?.charset || 'utf8';
			const target = this.data.toString(encodingHeader);
			if (cache) {
				this.toStringCached = target;
			}
			return target;
		},
		text(encoding, cache) {
			return this.toString(encoding, cache);
		},
		json(encoding, cache) {
			return this.toJSON(cache);
		},
		arrayBuffer(encoding, cache) {
			return this.dataBuffer;
		},
		buffer(encoding, cache) {
			return this.dataBuffer;
		},
		toJSON(cache) {
			if (noValue(this.dataBuffer)) {
				return;
			}
			if (cache) {
				if (this.toJSONCached) {
					return this.toJSONCached;
				}
			}
			const target = jsonParse(this.data);
			if (cache) {
				this.toJSONCached = target;
			}
			return target;
		},
		serialize(cache) {
			if (noValue(this.dataBuffer)) {
				return;
			}
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
		},
		decode(cache) {
			if (noValue(this.dataBuffer)) {
				return;
			}
			if (cache) {
				if (this.decodeCached) {
					return this.decodeCached;
				}
			}
			const encodingHeader = this.head?.charset;
			if (encodingHeader) {
				return this.toString(cache);
			}
			const serialize = this.head?.serialize;
			if (hasValue(serialize)) {
				if (serialize === 0) {
					return this.serialize(cache);
				} else if (serialize === 1) {
					return this.toJSON(cache);
				}
			}
			let target = decode(this.data);
			if (isUndefined(target)) {
				target = this.data;
			}
			if (cache) {
				this.serializeCached = target;
			}
			return target;
		},
		toObject(cache) {
			if (noValue(this.dataBuffer)) {
				return;
			}
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
	},
	attachMethods(target) {
		assign(target.prototype, objectDataMethods.methods);
		eachObject(objectDataMethods.getters, (value, key) => {
			Object.defineProperty(target.prototype, key, {
				get: value,
				set: objectDataMethods.setters[key]
			});
		});
	}
};
