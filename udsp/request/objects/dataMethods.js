import {
	eachObject, jsonParse, isTrue, noValue, assign, clear, hasValue
} from '@universalweb/acid';
import { decode, encode } from '#utilities/serialize';
export const objectDataMethods = {
	getters: {
		data() {
			if (this.compiledDataAlready) {
				return this.compiledData;
			}
			if (noValue(this.dataBuffer)) {
				return undefined;
			}
			const serialize = this.head?.serialize;
			const dataConcatinated = Buffer.concat(this.dataBuffer);
			if (hasValue(serialize)) {
				if (serialize === 0) {
					this.compiledData = decode(dataConcatinated);
				} else if (serialize === 1) {
					this.compiledData = jsonParse(dataConcatinated);
				}
				dataConcatinated.fill(0);
			} else {
				clear(this.dataBuffer);
				this.compiledData = dataConcatinated;
			}
			this.compiledDataAlready = true;
			return this.compiledData;
		},
	},
	setters: {
		data(data) {
			this.dataBuffer = data;
		},
	},
	methods: {
		toString(cache) {
			if (cache) {
				if (this.toStringCached) {
					return this.toStringCached;
				}
			}
			if (noValue(this.dataBuffer)) {
				return;
			}
			const encodingHeader = this.head?.charset;
			const target = this.data.toString(encodingHeader || 'utf8');
			if (cache) {
				this.toStringCached = target;
			}
			return target;
		},
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
		},
		decode(cache) {
			const encodingHeader = this.head?.charset;
			if (encodingHeader) {
				return this.toString(cache);
			}
			const serialize = this.head?.serialize;
			if (serialize) {
				return this.data;
			}
		},
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
