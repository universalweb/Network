import { toBase64Url, toHex } from '#utilities/cryptography/utils';
import base38 from '#viat/storage/base38/index';
import runBench from '#utilities/benchmark';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
// const base38Encode = base38.encodeBase38;
// const hash = await viatCipherSuite.createBlockNonce(16);
// console.log(base38);
// const jsEncode = base38.pure.encodeBase38;
// const nativeEncode = base38.encodeBase38;
// const nativeBase38 = base38.encodeBase38(hash);
// const jsBase38 = base38.pure.encodeBase38(hash);
// console.log(nativeBase38, jsBase38);
// console.log(nativeBase38 === jsBase38);
// console.log(`ORIGINAL: ${hash.length} bytes`);
// console.log(`vBase38: ${base38.encodeBase38(hash).length} size`, base38.encodeBase38(hash));
// console.log(`Hex: ${toHex(hash).length} size`, toHex(hash));
// console.log(`base64URL: ${toBase64Url(hash).length} size`, toBase64Url(hash));
// console.log(hash, base38.encodeBase38(base38.decodeBase38(base38.encodeBase38(hash))));
// runBench(() => {
// 	nativeEncode(hash);
// }, () => {
// 	jsEncode(hash);
// });
export default base38;
