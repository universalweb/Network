import generateScheme from './pqClean.js';
export const dilithium87 = generateScheme('ml-dsa-87', {
	name: 'dilithium87',
	alias: 'ml_dsa87',
	id: 3,
	security: 3,
	preferred: false
});
export default dilithium87;
// const key = await dilithium87.signatureKeypair();
// console.log(key);
// const exported = await dilithium87.exportKeypair(key);
// console.log(exported);
// const msg = Buffer.from('hello world');
// console.log(exported.publicKey.length, exported.privateKey.length);
// const sig = await dilithium87.sign(msg, key);
// console.log(sig);
// console.log(await dilithium87.verify(sig, msg, key));
