import { readdir, stat } from 'fs/promises';
import du from 'du';
import getFolderSize from 'get-folder-size';
import { getViatDirectory } from '#utilities/directory';
import { join } from 'path';
const formatBytes = (bytes) => {
	const units = [
		'B', 'KB', 'MB', 'GB', 'TB',
	];
	let totalsize = bytes;
	let unitIndex = 0;
	while (totalsize >= 1024 && unitIndex < units.length - 1) {
		totalsize /= 1024;
		unitIndex++;
	}
	return `${totalsize.toFixed(2)} ${units[unitIndex]}`;
};
const filepath = await getViatDirectory();
const size = await getFolderSize.strict(filepath);
console.log(`The folder is ${size} bytes large`);
console.log(`That is the same as ${(size / 1000 / 1000).toFixed(2)} MB`);
console.log(formatBytes(await du(filepath, {
	// This uses actual disk blocks, not file sizes
	disk: true,
})));
