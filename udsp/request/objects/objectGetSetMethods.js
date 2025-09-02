import {
	eachObject,
	isTrue,
	jsonParse,
	noValue,
} from '@universalweb/utilitylib';
import { decode } from '#utilities/serialize';
const requestMethods = {
	getters: {
		response() {
			if (this.source) {
				return this.source.response;
			}
		},
	},
	setters: {},
};
const responseMethods = {
	getters: {
		request() {
			if (this.source) {
				return this.source.request;
			}
		},
	},
	setters: {},
};
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
		id() {
			return this.source.id;
		},
		method() {
			return this.source.method;
		},
		parameters() {
			return this.source.parameters;
		},
		path() {
			return this.source.path;
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
		},
		id() {
			return;
		},
		method() {
			return;
		},
		parameters() {
			return;
		},
		path() {
			return;
		},
	},
	attachMethods(target) {
		eachObject(objectGetSetMethods.getters, (get, key) => {
			const set = objectGetSetMethods.setters[key];
			Object.defineProperty(target.prototype, key, {
				get,
				set,
			});
		});
		if (target.isRequest) {
			eachObject(requestMethods.getters, (get, key) => {
				const set = requestMethods.setters[key];
				Object.defineProperty(target.prototype, key, {
					get,
					set,
				});
			});
		} else {
			eachObject(responseMethods.getters, (get, key) => {
				const set = responseMethods.setters[key];
				Object.defineProperty(target.prototype, key, {
					get,
					set,
				});
			});
		}
	},
};

