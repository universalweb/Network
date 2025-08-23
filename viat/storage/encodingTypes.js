import {
	base64ToBuffer, base64UrlToBuffer, hexToBuffer, toBase64, toBase64Url, toHex,
} from '#crypto/utils';
import base38 from './base38.js';
export const encodingTypes = {
	hex: {
		caseInsensitive: true,
		encode: toHex,
		decode: hexToBuffer,
		hex: true,
		type: 'hex',
	},
	base38: {
		encode: base38.encodeBase38,
		decode: base38.decodeBase38,
		base38: true,
		type: 'base38',
	},
	base64URLSafe: {
		encode: toBase64Url,
		decode: base64UrlToBuffer,
		base64URL: true,
		type: 'base64url',
		caseSensitive: true,
	},
	base64: {
		encode: toBase64,
		decode: base64ToBuffer,
		base64: true,
		type: 'base64',
		caseSensitive: true,
	},
};
export default encodingTypes;
