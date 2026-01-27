/**
	* @NAME SPHINCS+ with SHAKE256 - slh_dsa_shake_192s sphincs-shake-192s-simple
	* @DESCRIPTION sphincs-shake-192s-simple (s = SMALL/COMPACT)
 */
import generateScheme from './pqClean.js';
export const sphincs128 = generateScheme('sphincs-shake-128s-simple', {
	name: 'sphincs128',
	alias: 'slh_dsa_shake_128s',
	id: 6,
	security: 4,
	seedSize: 96,
	preferred: false,
});
export default sphincs128;
// const key = await sphincs128.signatureKeypair();
// console.log(key);
// const exported = await sphincs128.exportKeypair(key);
// console.log(exported.publicKey.length, exported.privateKey.length);
// const msg = Buffer.from('hello world');
// console.log(exported.publicKey.length, exported.privateKey.length);
// console.time('sign');
// const sig = await sphincs128.sign(msg, key);
// console.timeEnd('sign');
// console.log(sig);
// console.time('verify');
// console.log(await sphincs128.verify(sig, msg, key));
// console.timeEnd('verify');

