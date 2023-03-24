import { eachAsyncObject, construct, assign } from 'Acid';
import logs from '../utilities/logs/index.js';
import msgpack from '../utilities/msgpack/index.js';
import cryptoLib from '../utilities/crypto/index.js';
import certificate from '../utilities/certificate/index.js';
import certificates from '../utilities/certificates/index.js';
import file from '../utilities/file/index.js';
export class State {
	constructor(type, existingState) {
		this.type = type;
		this.utility = require('Acid');
	}
	getUtil(modules) {
		const thisClass = this;
		eachAsyncObject(modules, async (item, key) => {
			thisClass[key] = await import(`../utilities/${item}/`);
		});
	}
	logs = logs;
	msgpack = msgpack;
	crypto = cryptoLib;
	certificates = certificates;
	certificate = certificate;
}
export function createState(...args) {
	return construct(State, args);
}
