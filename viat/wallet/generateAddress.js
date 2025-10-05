import { hash256, hash512, hashLegacyAddress } from '#crypto/hash/shake256.js';
import { bufferAlloc } from '#crypto/utils.js';
import { encodeStrict } from '#utilities/serialize';
import { isBuffer } from '@universalweb/utilitylib';
import viat from '#crypto/cipherSuite/viat.js';
import viatLegacy from '#crypto/cipherSuite/legacy.js';
import viatQuantum from '#crypto/cipherSuite/quantum.js';
const walletCipherSuites = {
	hybrid: viat,
	quantum: viatQuantum,
	legacy: viatLegacy,
};
export async function generateAddress(publicKey, type = 0, version = 0, backupHash) {
	const source = {
		type,
		version,
		publicKey,
	};
	if (backupHash && isBuffer(backupHash)) {
		source.backupHash = backupHash;
	}
	const domained = await encodeStrict(source);
	if (viatLegacy.id === type) {
		return hashLegacyAddress(domained);
	} else if (viat.id === type) {
		return hash256(domained);
	} else if (viatQuantum.id === type) {
		return hash512(domained);
	}
}
export async function generateLegacyAddress(publicKey, version = 0, backupHash) {
	const source = {
		type: viatLegacy.id,
		version,
		publicKey,
	};
	if (backupHash && isBuffer(backupHash)) {
		source.backupHash = backupHash;
	}
	const domained = await encodeStrict(source);
	return hashLegacyAddress(domained);
}
