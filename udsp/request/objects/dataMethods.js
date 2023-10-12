import {
	eachObject, jsonParse, isTrue, noValue, assign, clear
} from '@universalweb/acid';
import { decode } from '#utilities/serialize';
export const objectDataMethods = {
	getters: {
		data() {
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
			const target = this.data.toString();
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

