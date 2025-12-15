import { decode, encodeStrict } from '#utilities/serialize';
// UnifiedStorage: Cache + LMDB + local Filesystem + distributed networked filesystem (future)
import {
	ensureDirectoryPath,
	getDirectoryStructure,
	getFiles,
	read,
	readStructured,
	write,
} from '#file';
import { DBStorage } from './dbStorage.js';
import { defaultFilesystemConfig } from './filesystems.js';
import { getViatDirectory } from '#utilities/directory';
import { isBuffer } from '@universalweb/utilitylib';
import path from 'path';
const defaultPath = await getViatDirectory();
class UnifiedStorage extends DBStorage {
	constructor(options = {}) {
		super(options);
	}
	getFullPath(source) {
		return path.join(this.storagePath, source);
	}
	async write(key, source) {
		const target = (isBuffer(source)) ? source : encodeStrict(source);
		await write(key, target, 'binary', true);
	}
	async writeBlock(block) {
		const savePath = await block.getPath();
		await write(savePath, block, 'binary', true);
	}
	async read(filePath) {
		const result = await read(filePath, 'binary');
		return (isBuffer(result)) ? result : decode(result);
	}
	async readBlock(block) {
		const savePath = await block.getPath();
		const result = await readStructured(savePath, 'block');
		return result;
	}
	async getFilesInDirectory(directoryPath) {
		return getFiles(directoryPath);
	}
	async getDirectoryStructure(directoryPath) {
		return getDirectoryStructure(directoryPath);
	}
	storagePath = defaultPath;
	filesystem = defaultFilesystemConfig;
}
export async function unifiedStorage(...args) {
	const source = await (new UnifiedStorage(...args));
	return source;
}
export default UnifiedStorage;
const exampleStorage = await unifiedStorage();
console.log('UNIFIED STORAGE', exampleStorage);
// const exampleKey = randomBuffer(64);
