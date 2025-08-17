import * as ed25519 from '../udsp/cryptoMiddleware/ed25519.js';
import { decode, encode } from '#utilities/serialize';
import { UWProfile } from '../UWProfile/index.js';
import { currentCertificateVersion } from '../defaults.js';
import { dilithium44 } from '../udsp/cryptoMiddleware/dilithium44.js';
import { isBuffer } from '@universalweb/acid';
import { write } from '../utilities/file.js';
export class ViatWallet extends UWProfile {
	constructor(config = {}) {
		const sourceInstance = super(config);
		return sourceInstance.then(async (source) => {
			return source.walletInitialize(config);
		});
	}
	async walletInitialize(config) {
		return this;
	}
}
export function viatWallet(config) {
	const source = new ViatWallet();
	return source;
}
