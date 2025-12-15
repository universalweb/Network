import { decode, encodeStrict, encodeSync } from '#utilities/serialize';
import { hasValue, isString, isTypedArray } from '@universalweb/utilitylib';
import viatDefaults from '#viat/defaults';
export const ADDRESS_TYPE = {
	TEXT: 0,
	EMOJI: 1,
	NUMERICAL: 2,
	MIXED: 3,
	BINARY: 4,
	DOMAIN: 5,
};
export const ENTITY_TYPE = {
	USER: 0,
	COMPANY: 1,
	GOVERNMENT: 2,
	NONE_PROFIT: 3,
	EDUCATION: 4,
};
function isEmojisOnly(str) {
	return (/^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\s]+$/u).test(str);
}
function isIntOnly(str) {
	return (/^[\d\s]+$/).test(str);
}
function isTextOnly(str) {
	return (/^[a-zA-Z\s]+$/).test(str);
}
function hasEmoji(str) {
	return (/[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}]/u).test(str);
}
export class VanityAddress {
	version = viatDefaults.vanityVersion;
	addressObject = {
		date: Date.now(),
		version: viatDefaults.vanityVersion,
		kind: ADDRESS_TYPE.DEFAULT,
		address: null,
		size: 0,
		verified: false,
	};
	constructor(address, wallet, domain, records, entity, verified, kind) {
		this.addressObject.address = address;
		if (domain) {
			this.addressObject.domain = domain;
		}
		if (wallet) {
			this.addressObject.wallet = wallet;
		}
		if (records) {
			this.addressObject.records = records;
		}
		if (isString(address)) {
			if (isEmojisOnly(address)) {
				this.addressObject.kind = ADDRESS_TYPE.EMOJI;
			} else if (isIntOnly(address)) {
				this.addressObject.kind = ADDRESS_TYPE.NUMERICAL;
			} else if (isTextOnly(address)) {
				this.addressObject.kind = ADDRESS_TYPE.TEXT;
			} else {
				this.addressObject.kind = ADDRESS_TYPE.MIXED;
			}
			if (hasEmoji(address)) {
				this.addressObject.emoji = true;
			}
			this.addressObject.size = this.addressObject.address.length;
		} else if (isTypedArray(address) || Buffer.isBuffer(address)) {
			this.addressObject.kind = ADDRESS_TYPE.BINARY;
			this.addressObject.size = address.byteLength || address.length || address.size || 0;
		}
		return this;
	}
}
function example() {
	console.log(new VanityAddress('🫠').addressObject);
	console.log(new VanityAddress('s🫠').addressObject);
	console.log(new VanityAddress(Buffer.from('sss')).addressObject);
	console.log(new VanityAddress(new Uint8Array(2)).addressObject);
}
