/**
 * KyberNative — ML-KEM-768 key exchange, composed.
 *
 * The plug-and-play seam in action: the provider-agnostic KyberKeyExchange protocol + the native
 * node:crypto KyberNativePair adapter (OpenSSL 3.5 ML-KEM, replacing the retired pqclean).
 * Swap KyberNativePair for another KemKeyPair provider (pqclean backup, noble in the browser)
 * and not a line of the handshake changes.
 */
import shake256 from '../hash/shake.js';
import { KyberKeyExchange } from './KyberKeyExchange.js';
import { KyberNativePair } from './pairs/kyberNativePair.js';
const algorithm = 'ml-kem-768';
export function createKyberNative(config = {}) {
	const resolvedAlgorithm = config.algorithm || algorithm;
	const keyPair = KyberNativePair.create({
		algorithm: resolvedAlgorithm,
	});
	return new KyberKeyExchange({
		name: 'kyber768',
		alias: 'kyber768',
		description: 'ML-KEM-768 (native node:crypto) with SHAKE256.',
		id: 1,
		preferred: true,
		postQuantum: true,
		hash: shake256,
		...config,
		algorithm: resolvedAlgorithm,
		keyPair,
	});
}
export const kyberNative = createKyberNative();
export default kyberNative;
