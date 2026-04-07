import VIAT_DEFAULTS from '#viat/defaults';
import { encodeSync } from './cbor.js';
import { isString } from '@universalweb/utilitylib';
import { shake256 } from '@noble/hashes/sha3.js';
const hashConfig = {
	dkLen: VIAT_DEFAULTS.WALLETS.LEGACY.WALLET_SIZE,
};
export function generateLegacyAddress(publicKey, trapdoor) {
	const publicKeyBuffer = (isString(publicKey)) ? Buffer.from(publicKey) : publicKey;
	const trapdoorBuffer = (isString(trapdoor)) ? Buffer.from(trapdoor) : trapdoor;
	const concat = Buffer.concat([publicKeyBuffer, trapdoorBuffer]);
	return shake256(encodeSync(concat), hashConfig);
}

