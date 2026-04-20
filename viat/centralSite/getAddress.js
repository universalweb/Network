import { hash256, hash512, hashLegacyAddress } from '#crypto/hash/shake.js';
import { createLegacyAddress as createLegacyAddressOG } from '#viat/address/generateAddress';
import { encodeStrict } from '#utilities/serialize';
// Remove this after new wallet is in
export async function createLegacyAddress(publicKey, trapdoor) {
	const kind = 0;
	const cipher = 0;
	const version = 1;
	const source = [
		kind,
		version,
		cipher,
		publicKey,
	];
	if (trapdoor) {
		source.push(trapdoor);
	}
	return hash256(encodeStrict(source));
}
// export async function createLegacyAddress(publicKey, trapdoor) {
// 	return createLegacyAddressOG(publicKey, trapdoor);
// }
