import { hasLength } from '@universalweb/acid';
import { decode } from 'msgpackr';
import { destroy } from './destory';
export async function assembleData(data, source, incomingDataEncoding) {
	if (hasLength(data)) {
		source.body = Buffer.concat(data);
		if (incomingDataEncoding === 'struct' || !incomingDataEncoding) {
			try {
				source.body = decode(source.body);
			} catch (err) {
				return this.destroy('Failed to decode incoming data');
			}
		}
	}
}
