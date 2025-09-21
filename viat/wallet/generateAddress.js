import ed25519 from '#crypto/signature/ed25519.js';
import { encodeStrict } from '#utilities/serialize';
import { hashLegacyAddress } from '#crypto/hash/shake256';
export async function generateAddress(publicKey, type, version = 0) {
	const domained = await encodeStrict({
		type,
		version,
		publicKey,
	});
	if (this.cipherSuite.walletSize === 20) {
		return this.cipherSuite.hash.hashLegacyAddress(domained);
	} else if (this.cipherSuite.walletSize === 32) {
		return this.cipherSuite.hash.hash256(domained);
	} else if (this.cipherSuite.walletSize === 64) {
		return this.cipherSuite.hash.hash512(domained);
	}
}
