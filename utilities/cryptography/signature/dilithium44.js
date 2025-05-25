import generateScheme from './pqClean.js';
export const dilithium44 = generateScheme('ml-dsa-44', {
	name: 'dilithium44',
	alias: 'ml_dsa44',
	id: 1,
	security: 1,
	preferred: false
});
export default dilithium44;
// const key = await dilithium44.signatureKeypair();
// console.log(key);
// const exported = await dilithium44.exportKeypair(key);
// console.log(exported);
// const msg = Buffer.from('hello world');
// console.log(exported.publicKey.length, exported.privateKey.length);
// const sig = await dilithium44.sign(msg, key);
// console.log(sig);
// console.log(await dilithium44.verify(sig, msg, key));
