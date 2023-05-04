import { each, construct, assign } from 'Acid';
import logs from '#utilities/logs/index';
import msgpack from '#utilities/msgpack/index';
import cryptoLib from '#utilities/crypto/index';
import certificate from '#utilities/certificate/index';
import certificates from '#utilities/certificates/index';
import file from '#utilities/file/index';
export class State {
	constructor(type, existingState) {
		this.type = type;
		this.utility = require('Acid');
	}
	getUtil(modules) {
		const thisClass = this;
		each(modules, async (item, key) => {
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
