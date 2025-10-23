import { hash256, hash512, hashLegacyAddress } from '#crypto/hash/shake256.js';
import { bufferAlloc } from '#crypto/utils.js';
import { encode } from '#utilities/serialize';
import { isBuffer } from '@universalweb/utilitylib';
import viat from '#crypto/cipherSuite/viat.js';
import viatLegacy from '#crypto/cipherSuite/legacy.js';
import viatQuantum from '#crypto/cipherSuite/quantum.js';
const walletCipherSuites = {
	hybrid: viat,
	quantum: viatQuantum,
	legacy: viatLegacy,
};
// Consider CBOR compatability
export function generateAddressStruct(publicKey, cipher = '0', version = '0', kind = '0', ...args) {
	const source = [
		kind,
		version,
		cipher,
		publicKey,
	];
	if (args.length) {
		source.push(...args);
	}
	return source;
}
export function generateLegacyAddressStruct(publicKey, cipher = '0', version = '0', kind = '0', backupHash) {
	const source = generateAddressStruct(publicKey, cipher, version, kind);
	source.push(backupHash);
	return source;
}
export async function generateLegacyAddress(publicKey, version = '0', kind = '0', backupHash) {
	const source = generateLegacyAddressStruct(publicKey, '0', version, kind, backupHash);
	const domained = await encode(source);
	return hashLegacyAddress(domained);
}
export async function generateAddress(publicKey, cipher = 0, version, kind, backupHash) {
	if (viatLegacy.id === cipher) {
		return generateLegacyAddress(publicKey, version, kind, backupHash);
	}
	const source = generateAddressStruct(publicKey, cipher, version, kind, backupHash);
	const domained = await encode(source);
	if (viat.id === cipher) {
		return hash256(domained);
	} else if (viatQuantum.id === cipher) {
		return hash512(domained);
	}
	return generateLegacyAddress(publicKey, version, kind, backupHash);
}
