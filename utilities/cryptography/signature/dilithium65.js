/*
	NOTE: "The use of ML-KEM-768 and ML-KEM-1024 are approved. However, for interoperability and maintainability reasons, ML-KEM-768 will not be approved beyond 2030."
	NOTE: This may mean we will need to adopt cat 5 instead. It is a point of concern as to why.
*/
import generateScheme from './pqClean.js';
export const dilithium65 = generateScheme('ml-dsa-65', {
	name: 'dilithium65',
	alias: 'ml_dsa65',
	id: 2,
	security: 2,
	seedSize: 96,
	minimumSeedSize: 32,
	preferred: false,
});
export default dilithium65;
// const key = await dilithium65.signatureKeypair();
// console.log(key);
// const exported = await dilithium65.exportKeypair(key);
// console.log(exported);
// console.log(exported.publicKey.length, exported.privateKey.length);
// const msg = Buffer.from('hello world');
// const sig = await dilithium65.sign(msg, key);
// console.log(sig.length, dilithium65.signatureSize);
// console.log(await dilithium65.verify(sig, msg, key));
