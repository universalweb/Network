/**
	* @NAME falcon-padded-1024
	* @DESCRIPTION Falcon-1024 padded has a fixed length signature of 1280 bytes. Avoid using this until further notice.
 */
import generateScheme from './pqClean.js';
export const falcon1024 = generateScheme('falcon-padded-1024', {
	name: 'falcon1024',
	alias: 'falcon-1024',
	id: 5,
	security: 4,
	sideSize: 128,
	preferred: false
});
export default falcon1024;
// const key = await falcon1024.signatureKeypair();
// console.log(key);
// const exported = await falcon1024.exportKeypair(key);
// console.log(exported);
// const imported = await falcon1024.initializeKeypair(exported);
// console.log(falcon1024.signatureSize);
// console.log(imported);
// console.log(exported);
// const msg = Buffer.from('hello world');
// console.log(exported.publicKey.length, exported.privateKey.length);
// const sig = await falcon1024.sign(msg, key);
// console.log(sig, sig.length);
// console.log(await falcon1024.verify(sig, key, msg));

