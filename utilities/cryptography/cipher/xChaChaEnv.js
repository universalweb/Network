/*
	Load the best library for the environment browser, Node, and or Bun
*/
let exportedModule;
if (typeof window === 'undefined') {
	const importedModule = await import('#cipher/xChaCha');
	exportedModule = importedModule;
	console.log(importedModule);
} else {
	const importedModule = await import('@noble/ciphers/chacha.js');
	exportedModule = importedModule;
}
const defaultExport = exportedModule.default || exportedModule;
const { xChaCha } = exportedModule;
export default defaultExport;
export { xChaCha };
