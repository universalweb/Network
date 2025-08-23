import {
	base64ToBuffer,
	base64UrlToBuffer,
	hexToBuffer,
	toBase64,
	toBase64Url,
	toHex,
} from '#crypto/utils.js';
import base38 from './base38.js';
import { createFilesystemConfig } from './createFilesystemConfig.js';
import { extendClass } from '@universalweb/utilitylib';
import logMethods from '#utilities/logs/classLogMethods';
import path from 'path';
const defaultFilesystemConfig = createFilesystemConfig();
// TODO: Add more to support filesystems
export const filesystemTypes = {
	generic: defaultFilesystemConfig,
	// TODO: Update XFS to use a different configuration
	xfs: defaultFilesystemConfig,
	apfs: defaultFilesystemConfig,
};
export default filesystemTypes;
