import { hasLength } from '@universalweb/acid';
import { decode } from 'msgpackr';
import { destroy } from './destory.js';
export async function assembleData(data, incomingDataEncoding) {
	if (hasLength(data)) {
		let compiledData = Buffer.concat(data);
		if (incomingDataEncoding === 'struct' || !incomingDataEncoding) {
			try {
				compiledData = decode(data);
			} catch (err) {
				return this.destroy('Failed to decode incoming data');
			}
		}
		return compiledData;
	}
}
