import { encode, encodeStrict, encodeSync } from '#utilities/serialize';
import { hash256 } from '#crypto/hash/shake.js';
import { randomBuffer } from '#crypto/utils.js';
console.log(encodeSync(1200003).length);
console.log(encodeSync('1.2.003').length);
console.log(encodeSync([
	23, 200, 3,
]).length);
console.log(encodeSync([12345678, 23]).length);
console.log(encodeSync([23]).length + encodeSync(12345678).length);
