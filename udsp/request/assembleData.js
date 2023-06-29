import { hasLength, jsonParse } from '@universalweb/acid';
import { decode } from 'msgpackr';
import { destroy } from './destory.js';
export async function assembleData(data, serialization) {
	if (hasLength(data)) {
		let compiledData = Buffer.concat(data);
		if (serialization) {
			if (serialization === 'obj' || serialization === 1) {
				try {
					compiledData = decode(data);
				} catch (err) {
					return this.destroy('Failed to decode incoming data as message pack');
				}
			} else if (serialization === 'json' || serialization === 2) {
				try {
					compiledData = jsonParse(data);
				} catch (err) {
					return this.destroy('Failed to decode incoming data as JSON');
				}
			}
		}
		return compiledData;
	}
}
