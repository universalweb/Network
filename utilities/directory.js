import * as url from 'url';
export function currentFile(importMeta) {
	return url.fileURLToPath(importMeta.url);
}
// currentPath(import.meta)
export function currentPath(importMeta) {
	return url.fileURLToPath(new URL('.', importMeta.url));
}
