import {
	eachObject, jsonParse, isTrue, noValue
} from '@universalweb/acid';
import { decode } from 'msgpackr';
export const objectGetSetMethods = {
	getters: {
		headers() {
			return this.head;
		},
		body() {
			return this.data;
		},
		url() {
			return this.path;
		},
		params() {
			return this.parameters;
		},
	},
	setters: {
		headers(value) {
			this.head = value;
		},
		body(value) {
			this.data = value;
		},
		url(value) {
			this.path = value;
		},
		params(value) {
			this.parameters = value;
		}
	},
	attachMethods(target) {
		eachObject(objectGetSetMethods.getters, (key, value) => {
			Object.defineProperty(target.prototype, key, {
				get: value,
				set: objectGetSetMethods.setters[key]
			});
		});
	}
};

