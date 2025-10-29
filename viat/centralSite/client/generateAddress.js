import { decode, encodeSync } from './cbor.js';
import { shake256 } from '@noble/hashes/sha3.js';
import viatDefaults from '#viat/defaults';
const hashConfig = {
	dkLen: viatDefaults.wallets.legacy.walletSize,
};
export function generateAddress(publicKey, backupHash) {
	const kind = 0;
	const cipher = 0;
	const version = 1;
	const source = [
		kind,
		version,
		cipher,
		publicKey,
	];
	if (backupHash) {
		source.push(backupHash);
	}
	return shake256(encodeSync(source), hashConfig);
}

