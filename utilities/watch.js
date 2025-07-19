import { isString } from '@universalweb/acid';
import nodeWatch from 'node-watch';
export function watch(item, callback) {
	return nodeWatch(item, {
		recursive: true,
	}, (evt, filename) => {
		if (evt === 'update' && filename && isString(filename)) {
			return callback(evt, filename);
		}
	});
}
