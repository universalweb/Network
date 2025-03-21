/**
	* @NAME SPHINCS+ with SHAKE256 - slh_dsa_shake_192s sphincs-shake-192s-simple
 */
import generateScheme from './pqClean.js';
export const sphincs192 = generateScheme('sphincs-shake-192s-simple', {
	name: 'sphincs192',
	alias: 'slh_dsa_shake_192s',
	id: 4,
	security: 4,
	preferred: false
});
export default sphincs192;
// const key = await sphincs192.signatureKeypair();
// console.log(key);
// const exported = await sphincs192.exportKeypair(key);
// console.log(exported);
// const msg = Buffer.from('hello world');
// console.log(exported.publicKey.length, exported.privateKey.length);
// const sig = await sphincs192.sign(msg, key);
// console.log(sig);
// console.log(await sphincs192.verify(sig, key, msg));

