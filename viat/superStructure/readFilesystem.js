import dirTree from 'directory-tree';
export function createFilesystem(folderPath) {
	const tree = dirTree(folderPath, {
		// Include type (file/directory)
		attributes: ['type'],
		// Normalize paths for consistency
		normalizePath: true
	});
	return tree;
}
