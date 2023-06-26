import { hasLength, jsonParse } from '@universalweb/acid';
import { decode } from 'msgpackr';
import { destroy } from './destory.js';
export async function assembleData(data, contentType) {
	if (hasLength(data)) {
		let compiledData = Buffer.concat(data);
		if (contentType) {
			if (contentType === 'obj' || contentType === 1) {
				try {
					compiledData = decode(data);
				} catch (err) {
					return this.destroy('Failed to decode incoming data as message pack');
				}
			} else if (contentType === 'json' || contentType === 2) {
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
