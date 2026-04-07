import { HASH_ALGORITHMS, TRAPDOOR_TYPES } from '#viat/defaults';
import { decodeSync, encode, encodeSync } from '#utilities/serialize';
import { hash256, hash512, hashLegacyAddress } from '#crypto/hash/shake.js';
import viat from '#crypto/cipherSuite/viat.js';
import viatLegacy from '#crypto/cipherSuite/legacy.js';
import viatQuantum from '#crypto/cipherSuite/quantum.js';
// Encode strict should not be used on arrays with specific ordering.
const walletCipherSuites = {
	hybrid: viat,
	quantum: viatQuantum,
	legacy: viatLegacy,
};
export function createAddressStruct(publicKey, trapdoor, cipher, hash, version, kind) {
	const source = [
		kind,
		version,
		cipher,
		hash,
		publicKey,
		trapdoor,
	];
	return source;
}
export function createLegacyAddressStruct(publicKey, trapdoor) {
	const source = [
		publicKey,
		trapdoor,
	];
	return Buffer.concat(source);
}
// NOTE: Legacy addresses have a strict format and the address size is restricted to this legacy format
export async function createLegacyAddress(publicKey, trapdoor) {
	const source = createLegacyAddressStruct(publicKey, trapdoor);
	const domained = await encode(source);
	return hashLegacyAddress(domained);
}
export async function createAddress(publicKey, trapdoor, cipher = 0, version = 0, kind = 0) {
	if (viatLegacy.id === cipher) {
		return createLegacyAddress(publicKey, trapdoor);
	}
	const source = createAddressStruct(publicKey, trapdoor, cipher, version, kind);
	const domained = await encode(source);
	if (viat.id === cipher) {
		return hash256(domained);
	} else if (viatQuantum.id === cipher) {
		// TODO: Lower this to either (256 + X < 512) reserve larger hashes to modular format
		// NOTE: After some time modular addresses will be preferred for quantum security & algo agility
		return hash512(domained);
	}
	return;
}
// NOTE: Future modular address format
export async function createModularAddress(publicKey, trapdoor, cipher, version = 0, kind = 0) {
	const addressHash = await createAddress(publicKey, trapdoor, cipher, version, kind);
	// NOTE: Small int values are only 1 byte in CBOR 0-23 so no wasted space
	// NOTE: Could include trapdoor checksum or hash if a address was only receiving viat and want extra security
	// NOTE: Kind could be used to indicate multisig or other future features
	// NOTE: Consider OBJECT based instead of array based for more flexible future proofing and readability but would require more complex encoding and more bytes used for small addresses
	// NOTE: Compact array version can work keep other meta data inside of a wallet block and address is required vars
	const target = await encode([
		kind, version, cipher, addressHash,
	]);
	return target;
}
async function example() {
	const ex = (await createModularAddress(Buffer.from('hello world'), null, 1, 0, 0));
	console.log(decodeSync(ex), ex.length);
}
// example();
