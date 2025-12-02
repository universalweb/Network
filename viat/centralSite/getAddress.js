import { generateAddress, generateLegacyAddress } from '#viat/address/generateAddress';
import { hash256, hash512, hashLegacyAddress } from '#crypto/hash/shake.js';
import { encodeStrict } from '#utilities/serialize';
export async function createLegacyAddress(publicKey, trapdoor) {
	return generateLegacyAddress(publicKey, undefined, undefined, trapdoor);
}
