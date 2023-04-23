import * as url from 'url';
export function currentFile(importMeta) {
	if (globalThis.__filename) {
		return __filename;
	}
	return url.fileURLToPath(importMeta.url);
}
// currentPath(import.meta)
export function currentPath(importMeta) {
	if (globalThis.__dirname) {
		return __dirname;
	}
	return url.fileURLToPath(new URL('.', importMeta.url));
}
