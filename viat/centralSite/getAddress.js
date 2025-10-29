import { generateAddress, generateLegacyAddress } from '#viat/wallet/generateAddress';
import { hash256, hash512, hashLegacyAddress } from '#crypto/hash/shake256.js';
import { encodeStrict } from '#utilities/serialize';
export async function createLegacyAddress(publicKey, backupHash) {
	return generateLegacyAddress(publicKey, undefined, undefined, backupHash);
}
