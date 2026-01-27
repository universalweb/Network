/**
	* @NAME SPHINCS+ with SHAKE256 - slh_dsa_shake_192s sphincs-shake-192s-simple
	* @DESCRIPTION sphincs-shake-192s-simple (s = SMALL/COMPACT)
 */
import generateScheme from './pqClean.js';
export const sphincs192 = generateScheme('sphincs-shake-192s-simple', {
	name: 'sphincs192',
	alias: 'slh_dsa_shake_192s',
	id: 6,
	security: 4,
	seedSize: 96,
	preferred: false,
});
export default sphincs192;
// const key = await sphincs192.signatureKeypair();
// console.log(key);
// const exported = await sphincs192.exportKeypair(key);
// console.log(exported.publicKey.length, exported.privateKey.length);
// const msg = Buffer.from('hello world');
// console.log(exported.publicKey.length, exported.privateKey.length);
// console.time('sign');
// const sig = await sphincs192.sign(msg, key);
// console.timeEnd('sign');
// console.log(sig);
// console.time('verify');
// console.log(await sphincs192.verify(sig, msg, key));
// console.timeEnd('verify');

