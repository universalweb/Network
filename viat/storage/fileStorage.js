import {
	base64ToBuffer,
	base64UrlToBuffer,
	hexToBuffer,
	toBase64,
	toBase64Url,
	toHex,
} from '#crypto/utils.js';
import base38 from './base38.js';
import { extendClass } from '@universalweb/utilitylib';
import logMethods from '#utilities/logs/classLogMethods';
import path from 'path';
const encodingTypes = {
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
const defaultFilesystem = {
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
export const filesystemTypes = {
	generic: defaultFilesystem,
	xfs: defaultFilesystem,
	apfs: defaultFilesystem,
};
export default filesystemTypes;
