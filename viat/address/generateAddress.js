import { hash256, hash512, hashLegacyAddress } from '#crypto/hash/shake.js';
import { encode } from '#utilities/serialize';
import viat from '#crypto/cipherSuite/viat.js';
import viatLegacy from '#crypto/cipherSuite/legacy.js';
import viatQuantum from '#crypto/cipherSuite/quantum.js';
// Encode strict should not be used on arrays with specific ordering.
const walletCipherSuites = {
	hybrid: viat,
	quantum: viatQuantum,
	legacy: viatLegacy,
};
// Consider CBOR compatibility
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
export function generateLegacyAddressStruct(publicKey, trapdoor, cipher = '0', version = '0', kind = '0') {
	const source = generateAddressStruct(publicKey, cipher, version, kind);
	source.push(trapdoor);
	return source;
}
export async function generateLegacyAddress(publicKey, trapdoor, version = '0', kind = '0') {
	const source = generateLegacyAddressStruct(publicKey, '0', version, kind, trapdoor);
	const domained = await encode(source);
	return hashLegacyAddress(domained);
}
export async function generateAddress(publicKey, trapdoor, cipher = '0', version = '0', kind = '0') {
	if (viatLegacy.id === cipher) {
		return generateLegacyAddress(publicKey, version, kind, trapdoor);
	}
	const source = generateAddressStruct(publicKey, cipher, version, kind, trapdoor);
	const domained = await encode(source);
	if (viat.id === cipher) {
		return hash256(domained);
	} else if (viatQuantum.id === cipher) {
		return hash512(domained);
	}
	return generateLegacyAddress(publicKey, version, kind, trapdoor);
}
