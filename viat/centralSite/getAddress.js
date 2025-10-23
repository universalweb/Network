// import { generateAddress, generateLegacyAddress } from '#viat/wallet/generateAddress';
// export { generateAddress, generateLegacyAddress };
import { hash256, hash512, hashLegacyAddress } from '#crypto/hash/shake256.js';
import { encodeStrict } from '#utilities/serialize';
export async function generateAddress(publicKey, type = 0, version = 0) {
	const source = {
		type,
		version,
		publicKey,
	};
	const domained = await encodeStrict(source);
	if (domained) {
		return hashLegacyAddress(domained);
	}
}
