import { hash256, hash512, hashLegacyAddress } from '#crypto/hash/shake.js';
import { createLegacyAddress as createLegacyAddressOG } from '#viat/address/generateAddress';
import { encodeStrict } from '#utilities/serialize';
// Remove this after new wallet is in
export async function createLegacyAddress(publicKey, trapdoor) {
	const source = Buffer.concat([publicKey, trapdoor]);
	return hashLegacyAddress(source);
}
// export async function createLegacyAddress(publicKey, trapdoor) {
// 	return createLegacyAddressOG(publicKey, trapdoor);
// }
