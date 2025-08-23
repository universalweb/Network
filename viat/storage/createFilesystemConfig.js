import base38 from './base38.js';
import { encodingTypes } from './encodingTypes.js';
import { merge } from '@universalweb/utilitylib';
export function createFilesystemConfig(config) {
	const target = {
		wallet: {
			pathPrefix: {
				size: 1,
				depth: 3,
				encoding: encodingTypes.hex,
			},
			uniquePath: {
				sizeOptions: [
					12, 16, 18, 24, 26,
				],
				size: 16,
				startIndex: 64 - 16,
				encoding: encodingTypes.base38,
			},
		},
		transaction: {
			pathPrefix: {
				size: 1,
				depth: 2,
				encoding: encodingTypes.hex,
			},
			uniquePath: {
				sizeOptions: [
					12, 16, 18, 24, 26,
				],
				size: 12,
				startIndex: 64 - 12,
				encoding: encodingTypes.base38,
			},
		},
		uniquePath: {
			encoding: encodingTypes.base38,
		},
	};
	merge(target, config);
	return target;
}
export default createFilesystemConfig;
