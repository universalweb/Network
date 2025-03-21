import {
	clearBuffer, clearBuffers, concatBuffer, int32
} from '#crypto';
import { assign } from '@universalweb/acid';
export class HashScheme {
	constructor(config) {
		assign(this, config);
		return this;
	}
	async concatHash(...sources) {
		return this.hash256(concatBuffer(sources));
	}
	async concatHash512(...sources) {
		console.log('ConcatHash512', sources);
		return this.hash512(concatBuffer(sources));
	}
	async combineKeys(...sources) {
		// console.log('Combine', sources);
		const combinedKeys = await this.concatHash(...sources);
		return combinedKeys;
	}
	async combineSessionKeys(oldTransmitKey, oldReceiveKey, source) {
		console.log('combineSessionKeys', source.transmitKey, oldTransmitKey, source.receiveKey, oldReceiveKey);
		if (oldTransmitKey) {
			source.transmitKey = await this.combineKeys(oldTransmitKey, source.transmitKey);
		}
		if (oldReceiveKey) {
			source.receiveKey = await this.combineKeys(oldReceiveKey, source.receiveKey);
		}
	}
	async combineKeysFree(...sources) {
		// console.log('Combine', key1, key2);
		const combinedKeys = await this.concatHash(...sources);
		clearBuffers(...sources);
		return combinedKeys;
	}
	async combineSessionKeysFree(oldTransmitKey, oldReceiveKey, source) {
		console.log('combineSessionKeys', source.transmitKey, oldTransmitKey, source.receiveKey, oldReceiveKey);
		if (oldTransmitKey) {
			source.transmitKey = await this.combineKeysFree(oldTransmitKey, source.transmitKey);
		}
		if (oldReceiveKey) {
			source.receiveKey = await this.combineKeysFree(oldReceiveKey, source.receiveKey);
		}
	}
}
export function hashScheme(config) {
	return new HashScheme(config);
}
