import { decode, encodeStrict, encodeSync } from '#utilities/serialize';
import { hasValue, isString, isTypedArray } from '@universalweb/utilitylib';
import viatDefaults from '#viat/defaults';
export function blockHashToHashStruct(block) {
	const {
		data,
		hash,
	} = block;
	const { meta } = data;
	const {
		kind,
		version,
	} = meta;
}
