import { encode } from '#utilities/serialize';
import { hash256 } from '#crypto/hash/shake.js';
import { mem } from '#utilities/mem';
import { randomBuffer } from '#crypto/utils.js';
import { times } from '@universalweb/utilitylib';
const ex = [randomBuffer(32), BigInt(1234567890)];
const list = [];
times(180000, (index) => {
	list.push([
		ex, ex, ex, ex, ex,
	]);
});
console.log((await encode(list)).length);
