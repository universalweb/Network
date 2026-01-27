import VIAT_DEFAULTS from '#viat/defaults';
import { encodeSync } from './cbor.js';
import { shake256 } from '@noble/hashes/sha3.js';
const hashConfig = {
	dkLen: VIAT_DEFAULTS.WALLETS.LEGACY.WALLET_SIZE,
};
export function generateAddress(publicKey, trapdoor) {
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
	return shake256(encodeSync(source), hashConfig);
}

